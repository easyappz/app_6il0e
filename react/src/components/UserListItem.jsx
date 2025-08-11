import Avatar from './Avatar';

export default function UserListItem({ user, onOpenProfile, onWriteMessage }) {
  const id = user?.id || user?._id || '';
  const username = user?.username || 'User';
  const bio = user?.bio || '';
  const avatarUrl = user?.avatarUrl || '';

  return (
    <div className="card user-item" role="listitem">
      <div className="user-item-inner">
        <div className="user-left">
          <Avatar username={username} avatarUrl={avatarUrl} size={48} />
        </div>
        <div className="user-main">
          <div className="user-name">{username}</div>
          <div className={bio ? 'user-bio' : 'user-bio muted'}>{bio || 'Био пока не заполнено'}</div>
        </div>
        <div className="user-actions">
          <button className="btn" onClick={onOpenProfile} aria-label={`Открыть профиль пользователя ${username}`}>Профиль</button>
          <button className="btn primary" onClick={onWriteMessage} aria-label={`Написать пользователю ${username}`}>Написать</button>
        </div>
      </div>
      <style>
        {`
          .user-item { padding: 12px; }
          .user-item-inner { display: flex; align-items: center; gap: 12px; }
          .user-left { flex: 0 0 auto; }
          .user-main { flex: 1 1 auto; min-width: 0; }
          .user-name { font-weight: 600; margin-bottom: 6px; }
          .user-bio { font-size: 14px; line-height: 1.4; }
          .user-actions { display: flex; gap: 8px; flex: 0 0 auto; }
          @media (max-width: 640px) {
            .user-actions { flex-direction: column; }
          }
        `}
      </style>
    </div>
  );
}
