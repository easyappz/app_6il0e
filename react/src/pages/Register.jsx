import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth';
import FormField from '../components/FormField';
import '../styles/pages.css';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload) => register(payload),
  });

  const onChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: '' }));
    setServerError('');
  };

  const validate = () => {
    const e = {};
    if (!form.username) e.username = 'Введите имя пользователя';
    if (!form.email) e.email = 'Введите email';
    if (form.email && form.email.indexOf('@') === -1) e.email = 'Некорректный email';
    if (!form.password) e.password = 'Введите пароль';
    if (form.password && form.password.length < 6) e.password = 'Минимум 6 символов';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const res = await mutateAsync({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      if (res && res.success && res.data) {
        localStorage.setItem('token', res.data.token);
        if (res.data.user) {
          localStorage.setItem('userId', res.data.user.id);
          localStorage.setItem('username', res.data.user.username || '');
          localStorage.setItem('avatarUrl', res.data.user.avatarUrl || '');
        }
        navigate('/feed', { replace: true });
      } else {
        setServerError(res?.error || 'Не удалось зарегистрироваться');
      }
    } catch (err) {
      setServerError(err?.response?.data?.error || 'Ошибка регистрации');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Регистрация</h1>
        <form onSubmit={onSubmit}>
          <FormField
            label="Имя пользователя"
            name="username"
            value={form.username}
            onChange={onChange}
            placeholder="Ваш никнейм"
            error={errors.username}
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            placeholder="example@mail.com"
            error={errors.email}
          />
          <FormField
            label="Пароль"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            placeholder="Минимум 6 символов"
            error={errors.password}
          />
          {serverError ? <div className="server-error">{serverError}</div> : null}
          <button className="btn primary full" type="submit" disabled={isPending}>
            {isPending ? 'Регистрируем...' : 'Зарегистрироваться'}
          </button>
        </form>
        <div className="auth-bottom">
          Уже есть аккаунт? <Link to="/login">Войдите</Link>
        </div>
      </div>
    </div>
  );
}
