import React, { useState } from 'react';
import { Container, Row, Col, Form, Spinner } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import axios from "axios";

const Auth = () => {
    // 1. Управление состояниями (веб-хуки)
    const [isLogin, setIsLogin] = useState(true); // Переключатель Вход / Регистрация
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Состояние формы (соответствует DTO)
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });

    // Получаем функции из Zustand (Глобальное хранилище) и Роутера
    const loginAction = useAuthStore(state => state.login);
    const navigate = useNavigate();

    // 2. Обработка ввода в поля
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(''); // Очищаем ошибку при новом вводе
    };

    // 3. Отправка формы (Взаимодействие с сервером)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            if (isLogin) {
                // ЛОГИН
                const response = await api.post('/Auth/login', {
                    email: formData.email,
                    password: formData.password
                });

                // Сохраняем токен в глобальное состояние и localStorage
                loginAction(response.data.token);
                // Перекидываем пользователя на главную страницу
                navigate('/');
            } else {
                // РЕГИСТРАЦИЯ

                await api.post('/Auth/register', {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                });

                const response = await api.post('/Auth/login', {
                    email: formData.email,
                    password: formData.password
                });

                setSuccessMsg('Регистрация успешна! Теперь вы можете войти.');
                loginAction(response.data.token);
                // Перекидываем пользователя на главную страницу
                navigate('/');
            }
        } catch (err: unknown) {
            // если это ошибка от сервера (Axios)
            if (axios.isAxiosError(err)) {
                if (err.response && err.response.data) {
                    setError(typeof err.response.data === 'string'
                        ? err.response.data
                        : 'Ошибка запроса. Проверьте данные.');
                } else {
                    setError('Отсутствует связь с сервером. Сеть недоступна.');
                }
            } else {
                // Если это не ошибка сервера, а какая-то другая проблема в коде
                setError('Произошла непредвиденная ошибка системы.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
            <Row className="w-100 justify-content-center">
                <Col md={6} lg={5}>
                    {/* Анимация появления всей карточки */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="card p-4"
                    >
                        <h2 className="text-center mb-4" style={{ color: 'var(--neon-magenta)' }}>
                            {isLogin ? 'СИСТЕМА: ВХОД' : 'СИСТЕМА: РЕГИСТРАЦИЯ'}
                        </h2>

                        {/* Вывод системных сообщений */}
                        {error && <div className="p-2 mb-3 alert-cyber">{error}</div>}
                        {successMsg && <div className="p-2 mb-3 alert-success-cyber">{successMsg}</div>}

                        <Form onSubmit={handleSubmit}>
                            {/* Используем AnimatePresence для плавного скрытия/появления поля Username */}
                            <AnimatePresence mode="wait">
                                {!isLogin && (
                                    <motion.div
                                        key="username"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Form.Group className="mb-3">
                                            <Form.Label style={{ color: 'var(--neon-cyan)' }} >Идентификатор (Username)</Form.Label>
                                            <Form.Control
                                                className="form-control-cyber"
                                                type="text"
                                                name="username"
                                                placeholder="Введите ваш никнейм"
                                                value={formData.username}
                                                onChange={handleChange}
                                                required={!isLogin}
                                            />
                                        </Form.Group>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Form.Group className="mb-3">
                                <Form.Label style={{ color: 'var(--neon-cyan)' }}>Сеть (Email)</Form.Label>
                                <Form.Control
                                    className="form-control-cyber"
                                    type="email"
                                    name="email"
                                    placeholder="user@neural.net"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label style={{ color: 'var(--neon-cyan)' }}>Ключ доступа (Password)</Form.Label>
                                <Form.Control
                                    className="form-control-cyber"
                                    type="password"
                                    name="password"
                                    placeholder="********"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>

                            <button
                                type="submit"
                                className="btn btn-cyber w-100 py-2 d-flex justify-content-center align-items-center"
                                disabled={loading}
                            >
                                {loading ? <Spinner animation="border" size="sm" /> : (isLogin ? 'ВОЙТИ' : 'РЕГИСТРАЦИЯ')}
                            </button>
                        </Form>

                        <div className="text-center mt-4">
                            <span style={{ color: '#aaa' }}>
                                {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
                            </span>
                            <span
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError('');
                                    setSuccessMsg('');
                                }}
                                style={{
                                    color: 'var(--neon-cyan)',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    textUnderlineOffset: '4px'
                                }}
                            >
                                {isLogin ? 'Зарегистрироваться' : 'Войти'}
                            </span>
                        </div>
                    </motion.div>
                </Col>
            </Row>
        </Container>
    );
};

export default Auth;