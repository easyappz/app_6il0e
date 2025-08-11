import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getConversations } from '../api/messages';
import ConversationItem from '../components/messages/ConversationItem';
import '../styles/pages.css';

export default function Messages() {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const limit = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['conversations', { page }],
    queryFn: () => getConversations({ page, limit }),
    keepPreviousData: true,
  });

  useEffect(() => {
    if (!data || !data.success) return;
    const payload = Array.isArray(data.data?.items) ? data.data.items : (Array.isArray(data.data) ? data.data : []);
    setList((prev) => {
      const ids = new Set(prev.map((c) => c._id || c.id));
      const merged = [...prev];
      payload.forEach((c) => {
        const key = c._id || c.id;
        if (!ids.has(key)) merged.push(c);
      });
      return merged;
    });
  }, [data]);

  const filtered = useMemo(() => {
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter((c) => {
      const other = c.otherUser || c.participant || null;
      const name = (other?.username || '').toLowerCase();
      return name.includes(s);
    });
  }, [list, search]);

  const hasMore = useMemo(() => {
    const payload = Array.isArray(data?.data?.items) ? data.data.items : (Array.isArray(data?.data) ? data.data : []);
    return payload.length === limit;
  }, [data]);

  const onOpenConversation = (cid) => {
    if (!cid) return;
    if (location.pathname.startsWith('/messages')) {
      navigate(`/messages/${cid}`);
    } else {
      navigate(`/messages/${cid}`);
    }
  };

  return (
    <div className="messages-page">
      <aside className="dialogs-panel">
        <div className="dialogs-header">
          <h2>Сообщения</h2>
          <div className="dialogs-search">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени..."
              aria-label="Поиск диалога"
            />
          </div>
        </div>

        {isLoading && list.length === 0 ? <div className="loading small">Загрузка...</div> : null}
        {isError ? <div className="server-error">Не удалось загрузить список диалогов</div> : null}

        <div className="dialogs-list">
          {filtered.map((conv) => {
            const cid = conv._id || conv.id;
            return (
              <ConversationItem
                key={cid}
                active={params.conversationId === String(cid)}
                conversation={conv}
                onClick={() => onOpenConversation(cid)}
              />
            );
          })}
        </div>

        <div className="dialogs-footer">
          {hasMore ? (
            <button className="btn" onClick={() => setPage((p) => p + 1)} disabled={isLoading}>
              {isLoading ? 'Загружаем...' : 'Загрузить ещё'}
            </button>
          ) : (
            <div className="muted">Это все диалоги</div>
          )}
        </div>
      </aside>

      <section className="chat-panel">
        <Outlet />
      </section>
    </div>
  );
}
