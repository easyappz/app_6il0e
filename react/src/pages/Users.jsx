import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { searchUsers } from '../api/users';
import { createOrGetConversation } from '../api/messages';
import UserListItem from '../components/UserListItem';
import '../styles/pages.css';

export default function Users() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const limit = 20;

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  // Reset pagination and list on new search
  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [debouncedQuery]);

  const usersQuery = useQuery({
    queryKey: ['users', { query: debouncedQuery, page, limit }],
    queryFn: () => searchUsers({ query: debouncedQuery, page, limit }),
    keepPreviousData: true,
  });

  useEffect(() => {
    if (!usersQuery.data || !usersQuery.data.success) return;
    const payload = usersQuery.data.data || {};
    const pageItems = Array.isArray(payload.items) ? payload.items : [];
    setItems((prev) => {
      if (page === 1) return pageItems;
      const seen = new Set(prev.map((u) => String(u.id || u._id)));
      const merged = [...prev];
      pageItems.forEach((u) => {
        const key = String(u.id || u._id || '');
        if (!seen.has(key)) merged.push(u);
      });
      return merged;
    });
  }, [usersQuery.data, page]);

  const total = useMemo(() => {
    if (usersQuery.data && usersQuery.data.success) {
      return usersQuery.data.data?.total || 0;
    }
    return 0;
  }, [usersQuery.data]);

  const lastPageItemsCount = useMemo(() => {
    if (usersQuery.data && usersQuery.data.success) {
      const arr = usersQuery.data.data?.items || [];
      return Array.isArray(arr) ? arr.length : 0;
    }
    return 0;
  }, [usersQuery.data]);

  const hasMore = useMemo(() => {
    if (total > 0) return items.length < total;
    return lastPageItemsCount === limit; // fallback if total is not provided
  }, [items.length, total, lastPageItemsCount]);

  const createChatMutation = useMutation({
    mutationFn: (participantId) => createOrGetConversation({ participantId }),
    onSuccess: (res) => {
      if (res && res.success && res.data) {
        const cid = res.data._id || res.data.id;
        if (cid) navigate(`/messages/${cid}`);
      }
    },
    onError: () => {
      alert('Не удалось открыть диалог');
    },
  });

  const onOpenProfile = (userId) => navigate(`/profile/${userId}`);
  const onWriteMessage = (userId) => createChatMutation.mutate(userId);

  return (
    <div className="users-page">
      <div className="users-toolbar">
        <h2>Пользователи</h2>
        <div className="users-search">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск пользователей…"
            aria-label="Поиск пользователей"
          />
          <div className="muted small">
            {usersQuery.isLoading && items.length === 0 ? 'Загрузка…' : `Найдено: ${total}`}
          </div>
        </div>
      </div>

      {usersQuery.isError ? (
        <div className="server-error">Ошибка загрузки пользователей</div>
      ) : null}

      {items.length === 0 && !usersQuery.isLoading ? (
        <div className="card" style={{ padding: 16 }}>
          <div className="muted">Пользователи не найдены</div>
        </div>
      ) : null}

      <div className="users-list" role="list">
        {items.map((u) => {
          const id = u.id || u._id;
          return (
            <UserListItem
              key={id}
              user={u}
              onOpenProfile={() => onOpenProfile(id)}
              onWriteMessage={() => onWriteMessage(id)}
            />
          );
        })}
      </div>

      <div className="users-footer">
        {hasMore ? (
          <button className="btn" onClick={() => setPage((p) => p + 1)} disabled={usersQuery.isLoading}>
            {usersQuery.isLoading ? 'Загружаем…' : 'Загрузить ещё'}
          </button>
        ) : (
          <div className="muted">Это все результаты</div>
        )}
      </div>

      <style>
        {`
          .users-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 12px; }
          .users-search { display: flex; align-items: center; gap: 12px; }
          .users-search input { min-width: 260px; }
          .users-list { display: flex; flex-direction: column; gap: 12px; }
          .users-footer { display: flex; justify-content: center; margin-top: 16px; }
          .small { font-size: 12px; }
        `}
      </style>
    </div>
  );
}
