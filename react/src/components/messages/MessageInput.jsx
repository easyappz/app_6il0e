import { useState } from 'react';
import '../../styles/components.css';

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const value = text.trim();
    if (!value) return;
    if (onSend) onSend(value);
    setText('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled) handleSend();
    }
  };

  return (
    <div className="message-input">
      <textarea
        className="form-input message-textarea"
        placeholder="Введите сообщение..."
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
      />
      <button className="btn primary" onClick={handleSend} disabled={disabled || !text.trim()}>
        Отправить
      </button>
    </div>
  );
}
