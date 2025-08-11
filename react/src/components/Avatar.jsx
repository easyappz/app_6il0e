import '../styles/components.css';

export default function Avatar({ username = 'U', avatarUrl = '', size = 40 }) {
  const initials = (username || 'U').trim().slice(0, 2).toUpperCase();
  const style = { width: size + 'px', height: size + 'px' };

  if (avatarUrl) {
    return <img className="avatar" src={avatarUrl} alt={username} style={style} />;
  }

  return (
    <div className="avatar avatar-fallback" style={style} aria-label={username}>
      {initials}
    </div>
  );
}
