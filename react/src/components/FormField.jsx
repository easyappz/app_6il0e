import '../styles/components.css';

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  textarea = false,
  rows = 4,
}) {
  return (
    <div className="form-field">
      {label ? (
        <label htmlFor={name} className="form-label">{label}</label>
      ) : null}
      {textarea ? (
        <textarea
          id={name}
          name={name}
          className={"form-input" + (error ? ' has-error' : '')}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          className={"form-input" + (error ? ' has-error' : '')}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="on"
        />
      )}
      {error ? <div className="form-error" role="alert">{error}</div> : null}
    </div>
  );
}
