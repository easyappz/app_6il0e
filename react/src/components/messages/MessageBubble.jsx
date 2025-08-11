import '../../styles/components.css';

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n) => (n < 10 ? '0' + n : String(n));
  return pad(d.getHours()) + ':' + pad(d.getMinutes());
}

export default function MessageBubble({ message, isMine }) {
  const text = message.text || '';
  const time = formatTime(message.createdAt);
  const read = !!message.readAt;

  return (
    <div className={'bubble-row' + (isMine ? ' mine' : '')}>
      <div className={'bubble' + (isMine ? ' primary' : '')}>
        <div className="bubble-text">{text}</div>
        <div className="bubble-meta">
          <span className="time">{time}</span>
          {isMine ? <span className={'status' + (read ? ' read' : '')} title={read ? 'Прочитано' : 'Отправлено'}>✓</span> : null}
        </div>
      </div>
    </div>
  );
}
