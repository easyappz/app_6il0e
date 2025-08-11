import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFeed, createPost } from '../api/posts';
import PostCard from '../components/PostCard';
import FormField from '../components/FormField';
import '../styles/pages.css';

export default function Feed() {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const feedQuery = useQuery({
    queryKey: ['feed'],
    queryFn: () => getFeed({ page: 1, limit: 20, commentsLimit: 3 }),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createPost(payload),
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    }
  });

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    const text = content.trim();
    if (!text) {
      setError('Введите текст поста');
      return;
    }
    createMutation.mutate({ content: text });
  };

  return (
    <div className="feed-page">
      <div className="composer-card">
        <form onSubmit={onSubmit}>
          <FormField
            label="Новая запись"
            name="content"
            textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Поделитесь, что у вас нового..."
            error={error}
          />
          <div className="composer-actions">
            <button className="btn primary" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Публикуем...' : 'Опубликовать'}
            </button>
          </div>
        </form>
      </div>

      {feedQuery.isLoading ? (
        <div className="loading">Загружаем ленту...</div>
      ) : null}

      {feedQuery.isError ? (
        <div className="server-error">Ошибка загрузки ленты</div>
      ) : null}

      {feedQuery.data && feedQuery.data.success && Array.isArray(feedQuery.data.data) ? (
        <div className="posts-list">
          {feedQuery.data.data.map((p) => (
            <PostCard key={p._id} post={p} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
