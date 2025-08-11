import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/auth';
import FormField from '../components/FormField';
import '../styles/pages.css';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ emailOrUsername: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload) => login(payload),
  });

  const onChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: '' }));
    setServerError('');
  };

  const validate = () => {
    const e = {};
    if (!form.emailOrUsername) e.emailOrUsername = 'Введите email или имя пользователя';
    if (!form.password) e.password = 'Введите пароль';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const res = await mutateAsync({ emailOrUsername: form.emailOrUsername.trim(), password: form.password });
      if (res && res.success && res.data) {
        localStorage.setItem('token', res.data.token);
        if (res.data.user) {
          localStorage.setItem('userId', res.data.user.id);
          localStorage.setItem('username', res.data.user.username || '');
          localStorage.setItem('avatarUrl', res.data.user.avatarUrl || '');
        }
        navigate('/feed', { replace: true });
      } else {
        setServerError(res?.error || 'Не удалось войти');
      }
    } catch (err) {
      setServerError(err?.response?.data?.error || 'Ошибка авторизации');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Вход</h1>
        <form onSubmit={onSubmit}>
          <FormField
            label="Email или имя пользователя"
            name="emailOrUsername"
            value={form.emailOrUsername}
            onChange={onChange}
            placeholder="example@mail.com или username"
            error={errors.emailOrUsername}
          />
          <FormField
            label="Пароль"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            placeholder="Ваш пароль"
            error={errors.password}
          />
          {serverError ? <div className="server-error">{serverError}</div> : null}
          <button className="btn primary full" type="submit" disabled={isPending}>
            {isPending ? 'Входим...' : 'Войти'}
          </button>
        </form>
        <div className="auth-bottom">
          Нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
        </div>
      </div>
    </div>
  );
}
