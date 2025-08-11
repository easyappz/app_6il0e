import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, getUserById, getUserPosts, updateMe } from '../api/users';
import { createOrGetConversation } from '../api/messages';
import PostCard from '../components/PostCard';
import FormField from '../components/FormField';
import Avatar from '../components/Avatar';
import '../styles/pages.css';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMePage = !id;
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => getMe(),
    enabled: isMePage || !!id,
  });

  const userQuery = useQuery({
    queryKey: ['user', id],
    queryFn: () => getUserById(id),
    enabled: !!id,
  });

  const profileData = useMemo(() => {
    if (isMePage) return meQuery.data?.data || null;
    return userQuery.data?.data || null;
  }, [isMePage, meQuery.data, userQuery.data]);

  const postsQuery = useQuery({
    queryKey: ['user-posts', isMePage ? (meQuery.data?.data?.id || 'me') : id],
    queryFn: () => {
      const userId = isMePage ? (meQuery.data?.data?.id || '') : id;
      return getUserPosts(userId);
    },
    enabled: isMePage ? !!(meQuery.data && meQuery.data.data && meQuery.data.data.id) : !!id,
  });

  const [edit, setEdit] = useState({
    username: '',
    bio: '',
    avatarUrl: '',
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => updateMe(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      if (res && res.data) {
        localStorage.setItem('username', res.data.username || '');
        localStorage.setItem('avatarUrl', res.data.avatarUrl || '');
      }
    }
  });

  const canEdit = isMePage && meQuery.data && meQuery.data.success && meQuery.data.data;

  const onStartEdit = () => {
    if (!profileData) return;
    setEdit({
      username: profileData.username || '',
      bio: profileData.bio || '',
      avatarUrl: profileData.avatarUrl || '',
    });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      username: edit.username,
      bio: edit.bio,
      avatarUrl: edit.avatarUrl,
    });
  };

  const createChatMutation = useMutation({
    mutationFn: (participantId) => createOrGetConversation({ participantId }),
    onSuccess: (res) => {
      if (res && res.success && res.data) {
        const cid = res.data._id || res.data.id;
        if (cid) navigate(`/messages/${cid}`);
      }
    },
    onError: () => {
      alert('Не удалось открыть чат');
    }
  });

  const myId = meQuery.data?.data?.id || null;
  const isForeignProfile = !!id && myId && String(myId) !== String(id);

  return (
    <div className="profile-page">
      {!profileData ? (
        <div className="loading">Загрузка профиля...</div>
      ) : (
        <div className="profile-header">
          <Avatar username={profileData.username || 'User'} avatarUrl={profileData.avatarUrl || ''} size={72} />
          <div className="profile-info">
            <h2 className="profile-username">{profileData.username}</h2>
            {profileData.bio ? <p className="profile-bio">{profileData.bio}</p> : <p className="profile-bio muted">Био пока не заполнено</p>}
            {canEdit ? (
              <div className="profile-actions">
                <button className="btn" onClick={onStartEdit}>Редактировать</button>
              </div>
            ) : null}
            {!canEdit && isForeignProfile ? (
              <div className="profile-actions">
                <button
                  className="btn primary"
                  onClick={() => createChatMutation.mutate(id)}
                  disabled={createChatMutation.isPending}
                >
                  {createChatMutation.isPending ? 'Открываем...' : 'Написать сообщение'}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {canEdit && edit.username !== '' ? (
        <div className="card">
          <h3>Редактирование профиля</h3>
          <form onSubmit={onSubmit}>
            <FormField label="Имя пользователя" name="username" value={edit.username} onChange={(e) => setEdit((p) => ({ ...p, username: e.target.value }))} />
            <FormField label="Био" name="bio" textarea rows={4} value={edit.bio} onChange={(e) => setEdit((p) => ({ ...p, bio: e.target.value }))} />
            <FormField label="Ссылка на аватар" name="avatarUrl" value={edit.avatarUrl} onChange={(e) => setEdit((p) => ({ ...p, avatarUrl: e.target.value }))} />
            <div className="composer-actions">
              <button className="btn" type="button" onClick={() => setEdit({ username: '', bio: '', avatarUrl: '' })}>Отмена</button>
              <button className="btn primary" type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <h3 className="section-title">Посты</h3>
      {postsQuery.isLoading ? <div className="loading">Загружаем посты...</div> : null}
      {postsQuery.isError ? <div className="server-error">Ошибка загрузки постов</div> : null}
      {postsQuery.data && postsQuery.data.success && Array.isArray(postsQuery.data.data) ? (
        <div className="posts-list">
          {postsQuery.data.data.map((p) => (
            <PostCard key={p._id} post={p} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
