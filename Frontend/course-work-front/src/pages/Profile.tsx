import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Spinner, Badge, Nav } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/axios';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// --- ИНТЕРФЕЙСЫ ---
interface ProfileResponseDto {
    username: string;
    email: string;
    imagePath: string | null;
    roleName: string;
    isAdmin: boolean;
    createdAt: string;
}

interface NotificationDto {
    id: number;
    type: string; // "Info", "Warning", "Success"
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

const Profile = () => {
    const [profile, setProfile] = useState<ProfileResponseDto | null>(null);
    const [notifications, setNotifications] = useState<NotificationDto[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ username: '', imagePath: '' });
    const [uploadingImage, setUploadingImage] = useState(false);
    // Вкладки в профиле
    const [activeTab, setActiveTab] = useState<'info' | 'notifications'>('info');

    const updateGlobalUsername = useAuthStore(state => state.updateUsername);

    // --- ЗАГРУЗКА ДАННЫХ ПРОФИЛЯ И УВЕДОМЛЕНИЙ ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profRes, notifRes] = await Promise.all([
                    api.get('/Profile/me'),
                    api.get('/Notifications')
                ]);

                setProfile(profRes.data);
                setFormData({ username: profRes.data.username, imagePath: profRes.data.imagePath || '' });
                setNotifications(notifRes.data);
            } catch (err: unknown) {
                if (axios.isAxiosError(err)) setError('Ошибка загрузки данных: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- ЛОГИКА ПРОФИЛЯ ---
    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setSuccessMsg('');
        try {
            await api.put('/Profile/me/edit', { username: formData.username, imagePath: formData.imagePath || null });
            if (profile) setProfile({ ...profile, username: formData.username, imagePath: formData.imagePath });
            updateGlobalUsername(formData.username);
            setSuccessMsg('ДАННЫЕ СИСТЕМЫ ОБНОВЛЕНЫ');
            setIsEditing(false);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.toString() || 'Ошибка обновления.');
        }
    };

    // --- ЛОГИКА УВЕДОМЛЕНИЙ ---
    const handleMarkAsRead = async (id: number) => {
        try {
            await api.put(`/Notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (err) { console.error(err); }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/Notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (err) { console.error(err); }
    };

    const handleDeleteNotification = async (id: number) => {
        try {
            await api.delete(`/Notifications/${id}`);
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (err) { console.error(err); }
    };

    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const defaultAvatar = "https://ui-avatars.com/api/?name=" + (profile?.username || "U") + "&background=05050a&color=00f3ff&size=150&bold=true&border=1";
    let finalAvatarSrc = defaultAvatar;
    if (profile?.imagePath) {
        if (profile.imagePath.startsWith('/')) {
            finalAvatarSrc = `http://localhost:5070${profile.imagePath}`;
        } else {
            finalAvatarSrc = profile.imagePath;
        }
    }

    const getNotificationColor = (type: string) => {
        if (type === 'Warning') return 'var(--neon-magenta)';
        if (type === 'Success') return '#00ff00';
        return 'var(--neon-cyan)';
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // FormData - это специальный объект для отправки файлов
        const formFile = new FormData();
        formFile.append('file', file);

        // --- ДОБАВЛЯЕМ СТАРУЮ КАРТИНКУ В ЗАПРОС ---
        // Проверяем, есть ли у нас уже картинка, и что это картинка с нашего сервера (/uploads/)
        if (formData.imagePath && formData.imagePath.includes('/uploads/')) {
            formFile.append('oldPath', formData.imagePath);
        }

        setUploadingImage(true);
        try {
            const response = await api.post('/Upload/image', formFile, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Получаем новую ссылку и обновляем форму
            setFormData({ ...formData, imagePath: response.data.url });
        } catch (err: unknown) {
            // Если сервер вернет 500 ошибку, мы увидим причину здесь:
            if (axios.isAxiosError(err)) {
                alert('Ошибка при загрузке: ' + err.response?.data);
            } else {
                alert('Сбой сети при загрузке картинки');
            }
        } finally {
            setUploadingImage(false);
        }
    };

    if (loading) return <Container className="d-flex justify-content-center mt-5"><Spinner animation="grow" variant="info" /></Container>;

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={10} lg={8}>
                    <div className="card p-0 overflow-hidden">

                        {/* КИБЕРПАНК НАВИГАЦИЯ ВНУТРИ ПРОФИЛЯ */}
                        <Nav variant="tabs" className="nav-cyber border-bottom border-info px-3 pt-3 bg-dark">
                            <Nav.Item>
                                <Nav.Link active={activeTab === 'info'} onClick={() => setActiveTab('info')} className="fw-bold border-0">
                                    ЛИЧНОЕ ДЕЛО
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} className="fw-bold border-0">
                                    ТЕРМИНАЛ УВЕДОМЛЕНИЙ
                                    {unreadCount > 0 && <Badge bg="danger" className="ms-2 pulse-anim">{unreadCount}</Badge>}
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>

                        <div className="p-4">
                            {/* ========================================================= */}
                            {/* ВКЛАДКА 1: ПРОФИЛЬ */}
                            {/* ========================================================= */}
                            {activeTab === 'info' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    {error && <div className="alert-cyber p-2 mb-3 text-center">{error}</div>}
                                    {successMsg && <div className="alert-success-cyber p-2 mb-3 text-center">{successMsg}</div>}

                                    <Row className="align-items-center mb-4">
                                        <Col xs={4} className="text-center">
                                            <img src={finalAvatarSrc} alt="Avatar" className="img-fluid rounded-circle"
                                                 style={{ border: '3px solid var(--neon-cyan)', boxShadow: '0 0 15px rgba(0, 243, 255, 0.4)', width: '120px', height: '120px', objectFit: 'cover' }} />
                                        </Col>
                                        <Col xs={8}>
                                            <h3 style={{ color: 'var(--neon-cyan)' }}>{profile?.username}</h3>
                                            <div className="mb-2">
                                                <Badge bg={profile?.isAdmin ? "danger" : "secondary"} className="me-2 px-3 py-2">
                                                    УРОВЕНЬ: {profile?.roleName.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <p className="mb-0 text-light" style={{ fontSize: '1rem', letterSpacing: '1px' }}>
                                                <span style={{ color: 'var(--neon-magenta)', marginRight: '8px' }}>СЕТЬ:</span>
                                                <span style={{ textShadow: '0 0 2px rgba(255,255,255,0.5)' }}>{profile?.email}</span>
                                            </p>
                                        </Col>
                                    </Row>

                                    <hr style={{ borderColor: 'var(--neon-cyan)' }} />

                                    <AnimatePresence mode="wait">
                                        {!isEditing ? (
                                            <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center mt-4">
                                                <button className="btn btn-cyber w-100" onClick={() => setIsEditing(true)}>ИЗМЕНИТЬ ДАННЫЕ СИСТЕМЫ</button>
                                            </motion.div>
                                        ) : (
                                            <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4">
                                                <Form onSubmit={handleProfileSubmit}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label className="text-info">НОВЫЙ ИДЕНТИФИКАТОР</Form.Label>
                                                        <Form.Control className="form-control-cyber" name="username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required />
                                                    </Form.Group>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label className="text-info">Обложка (Файл)</Form.Label>
                                                        <div className="d-flex align-items-center gap-3">
                                                            {/* Кнопка выбора файла */}
                                                            <Form.Control
                                                                className="form-control-cyber"
                                                                type="file"
                                                                accept="image/png, image/jpeg, image/webp"
                                                                onChange={handleImageUpload}
                                                                disabled={uploadingImage}
                                                            />
                                                            {uploadingImage && <Spinner animation="border" size="sm" variant="info" />}
                                                        </div>

                                                        {/* Предпросмотр загруженной картинки */}
                                                        {formData.imagePath && (
                                                            <div className="mt-2">
                                                                <small className="text-success">Файл загружен:</small>
                                                                {/*
                                                                    Магия: указываем baseURL бэкенда, чтобы React знал, откуда качать.
                                                                    (Обычно baseURL импортируют из настроек axios)
                                                                */}
                                                                <img
                                                                    src={`http://localhost:5070${formData.imagePath}`}
                                                                    alt="Preview"
                                                                    style={{ height: '60px', marginLeft: '15px', border: '1px solid var(--neon-cyan)' }}
                                                                />
                                                            </div>
                                                        )}
                                                    </Form.Group>
                                                    <div className="d-flex gap-3">
                                                        <button type="button" className="btn btn-outline-secondary w-50" onClick={() => setIsEditing(false)}>ОТМЕНА</button>
                                                        <button type="submit" className="btn btn-cyber w-50">СОХРАНИТЬ</button>
                                                    </div>
                                                </Form>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}

                            {/* ========================================================= */}
                            {/* ВКЛАДКА 2: УВЕДОМЛЕНИЯ */}
                            {/* ========================================================= */}
                            {activeTab === 'notifications' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="text-info m-0">ВХОДЯЩИЕ СООБЩЕНИЯ</h5>
                                        {unreadCount > 0 && (
                                            <button className="btn btn-sm btn-outline-info" onClick={handleMarkAllRead}>ПРОЧИТАТЬ ВСЕ</button>
                                        )}
                                    </div>

                                    {notifications.length === 0 ? (
                                        <div className="text-center text-muted mt-5 mb-5">СООБЩЕНИЙ НЕТ</div>
                                    ) : (
                                        <div className="d-flex flex-column gap-3">
                                            <AnimatePresence>
                                                {notifications.map(notif => (
                                                    <motion.div
                                                        key={notif.id}
                                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                                                        className="p-3"
                                                        style={{
                                                            backgroundColor: notif.isRead ? 'rgba(0,0,0,0.5)' : 'rgba(0, 243, 255, 0.05)',
                                                            borderLeft: `4px solid ${getNotificationColor(notif.type)}`,
                                                            border: notif.isRead ? '1px solid #333' : `1px solid ${getNotificationColor(notif.type)}`,
                                                            cursor: notif.isRead ? 'default' : 'pointer'
                                                        }}
                                                        onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                                                    >
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <strong style={{ color: getNotificationColor(notif.type) }}>
                                                                {!notif.isRead && '🔴 '} {notif.title}
                                                            </strong>
                                                            <div className="d-flex align-items-center gap-3">
                                                                <small className="text-muted">{new Date(notif.createdAt).toLocaleString()}</small>
                                                                <button className="btn btn-sm btn-outline-danger py-0 px-2" onClick={(e) => { e.stopPropagation(); handleDeleteNotification(notif.id); }}>
                                                                    X
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div style={{ color: notif.isRead ? '#888' : '#fff' }}>
                                                            {notif.message}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                        </div>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default Profile;