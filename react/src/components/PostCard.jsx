import { useMutation, useQueryClient } from '@tanstack/react-query';
import Avatar from './Avatar';
import { likePost, unlikePost } from '../api/posts';
import '../styles/components.css';

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('ru-RU', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch (e) {
    return '';
  }
}

export default function PostCard({ post }) {
  const queryClient = useQueryClient();
  const meId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const hasLiked = Array.isArray(post.likes) && meId ? post.likes.indexOf(meId) !== -1 : false;

  const likeMutation = useMutation({
    mutationFn: () => likePost(post._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      if (post.author && post.author._id) {
        queryClient.invalidateQueries({ queryKey: ['user-posts', post.author._id] });
      }
    }
  });

  const unlikeMutation = useMutation({
    mutationFn: () => unlikePost(post._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      if (post.author && post.author._id) {
        queryClient.invalidateQueries({ queryKey: ['user-posts', post.author._id] });
      }
    }
  });

  const onToggleLike = () => {
    if (hasLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  return (
    <article className="post-card">
      <header className="post-header">
        <div className="post-author">
          <Avatar username={post.author?.username || 'User'} avatarUrl={post.author?.avatarUrl || ''} size={42} />
          <div className="post-meta">
            <div className="post-username">{post.author?.username || 'Без имени'}</div>
            <div className="post-date">{formatDate(post.createdAt)}</div>
          </div>
        </div>
      </header>

      <div className="post-content">{post.content}</div>

      <footer className="post-footer">
        <button
          className={"btn like-btn" + (hasLiked ? ' liked' : '')}
          onClick={onToggleLike}
          disabled={likeMutation.isPending || unlikeMutation.isPending}
          aria-pressed={hasLiked}
        >
          {hasLiked ? '❤ Лайкнуто' : '♡ Нравится'}
        </button>
        <div className="likes-count">Лайков: {Array.isArray(post.likes) ? post.likes.length : 0}</div>
      </footer>

      {Array.isArray(post.comments) && post.comments.length > 0 ? (
        <div className="post-comments">
          {post.comments.map((c) => (
            <div key={c._id} className="comment-row">
              <Avatar username={c.author?.username || 'U'} avatarUrl={c.author?.avatarUrl || ''} size={26} />
              <div className="comment-content">
                <div className="comment-author">{c.author?.username || 'Гость'}</div>
                <div className="comment-text">{c.text}</div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
