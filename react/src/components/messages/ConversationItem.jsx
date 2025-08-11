import Avatar from '../Avatar';
import '../../styles/components.css';

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  const pad = (n) => (n < 10 ? '0' + n : String(n));
  if (sameDay) return pad(d.getHours()) + ':' + pad(d.getMinutes());
  return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
}

export default function ConversationItem({ conversation, onClick, active }) {
  const other = conversation.otherUser || conversation.participant || {};
  const last = conversation.lastMessage || {};
  const unread = typeof conversation.unreadCount === 'number' ? conversation.unreadCount : 0;

  return (
    <button className={'dialog-row' + (active ? ' active' : '')} onClick={onClick}>
      <Avatar username={other.username || 'U'} avatarUrl={other.avatarUrl || ''} size={44} />
      <div className="dialog-info">
        <div className="dialog-top">
          <div className="dialog-name">{other.username || 'Пользователь'}</div>
          <div className="dialog-time">{formatTime(last.createdAt)}</div>
        </div>
        <div className="dialog-bottom">
          <div className="dialog-preview">{last.text || 'Нет сообщений'}</div>
          {unread > 0 ? <span className="badge small" aria-label="Непрочитанные">{unread}</span> : null}
        </div>
      </div>
    </button>
  );
}
