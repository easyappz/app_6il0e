import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getConversation, getMessages, markRead, sendMessage } from '../api/messages';
import Avatar from '../components/Avatar';
import MessageBubble from '../components/messages/MessageBubble';
import MessageInput from '../components/messages/MessageInput';

export default function Chat() {
  const { conversationId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const myId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || '') : '';

  const [page, setPage] = useState(1);
  const limit = 30;
  const [items, setItems] = useState([]);
  const bottomRef = useRef(null);

  const conversationQuery = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversation(conversationId),
    enabled: !!conversationId,
  });

  const messagesQuery = useQuery({
    queryKey: ['messages', conversationId, { page }],
    queryFn: () => getMessages(conversationId, { page, limit }),
    enabled: !!conversationId,
    keepPreviousData: true,
  });

  useEffect(() => {
    // reset when conversation changes
    setItems([]);
    setPage(1);
  }, [conversationId]);

  useEffect(() => {
    if (!messagesQuery.data || !messagesQuery.data.success) return;
    const payload = Array.isArray(messagesQuery.data.data?.items)
      ? messagesQuery.data.data.items
      : (Array.isArray(messagesQuery.data.data) ? messagesQuery.data.data : []);

    setItems((prev) => {
      const map = new Map();
      const merged = [...payload, ...prev];
      merged.forEach((m) => {
        map.set(m._id || m.id, m);
      });
      return Array.from(map.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });
  }, [messagesQuery.data]);

  const hasMore = useMemo(() => {
    const payload = Array.isArray(messagesQuery.data?.data?.items)
      ? messagesQuery.data.data.items
      : (Array.isArray(messagesQuery.data?.data) ? messagesQuery.data.data : []);
    return payload.length === limit;
  }, [messagesQuery.data]);

  const { mutateAsync: markReadMutate } = useMutation({
    mutationFn: (before) => markRead(conversationId, { before }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    }
  });

  const { mutateAsync: sendMutate, isPending: isSending } = useMutation({
    mutationFn: (text) => sendMessage(conversationId, { text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  useEffect(() => {
    // Mark as read on mount/change
    if (conversationId) {
      const nowIso = new Date().toISOString();
      markReadMutate(nowIso);
    }
  }, [conversationId]);

  useEffect(() => {
    // Auto scroll to bottom on messages change
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [items]);

  const conversation = conversationQuery.data?.data || null;
  const other = useMemo(() => {
    const o = conversation?.otherUser || conversation?.participant || null;
    return o;
  }, [conversation]);

  const onSend = async (text) => {
    if (!text || !text.trim()) return;

    const tempId = 'temp-' + Math.random().toString(36).slice(2);
    const optimistic = {
      _id: tempId,
      text,
      createdAt: new Date().toISOString(),
      senderId: myId,
      readAt: null,
    };
    setItems((prev) => [...prev, optimistic]);

    try {
      const res = await sendMutate(text);
      if (res && res.success && res.data) {
        setItems((prev) => prev.map((m) => (m._id === tempId ? res.data : m)));
      } else {
        setItems((prev) => prev.filter((m) => m._id !== tempId));
      }
    } catch (e) {
      setItems((prev) => prev.filter((m) => m._id !== tempId));
      // show lightweight alert
      alert('Не удалось отправить сообщение');
    } finally {
      // ensure we are at bottom
      if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const formatTitle = (u) => u?.username || 'Пользователь';

  if (conversationQuery.isLoading) {
    return <div className="chat-root"><div className="loading">Загрузка диалога...</div></div>;
  }
  if (conversationQuery.isError) {
    return <div className="chat-root"><div className="server-error">Ошибка загрузки диалога</div></div>;
  }
  if (!conversation) {
    return (
      <div className="chat-root">
        <div className="chat-placeholder">Выберите диалог слева</div>
      </div>
    );
  }

  return (
    <div className="chat-root">
      <div className="chat-header">
        <button className="btn ghost" onClick={() => navigate('/messages')}>&larr;</button>
        <Avatar username={other?.username || 'U'} avatarUrl={other?.avatarUrl || ''} size={40} />
        <div className="chat-title">
          <div className="name">{formatTitle(other)}</div>
          <div className="sub muted">Личные сообщения</div>
        </div>
      </div>

      <div className="chat-history">
        {hasMore ? (
          <div className="history-load">
            <button className="btn" onClick={() => setPage((p) => p + 1)} disabled={messagesQuery.isLoading}>Загрузить ещё</button>
          </div>
        ) : null}

        <div className="messages-stream">
          {items.map((m) => {
            const id = m._id || m.id;
            const senderId = m.senderId || m.sender?._id || m.authorId || '';
            const isMine = String(senderId) === String(myId);
            return (
              <MessageBubble key={id} message={m} isMine={isMine} />
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="chat-composer">
        <MessageInput disabled={isSending} onSend={onSend} />
      </div>
    </div>
  );
}
