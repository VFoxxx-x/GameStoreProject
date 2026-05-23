import {Table, Spinner, Badge} from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { api } from '../api/axios';
import axios from 'axios';
import { motion } from 'framer-motion';

interface UserResponseDto {
    id: number;
    username: string;
    email: string;
    roleName: string;
    isBanned: boolean;
    createdAt: string;
}
// КОМПОНЕНТ ДЛЯ ВКЛАДКИ "ПОЛЬЗОВАТЕЛИ"

export const AdminUsers = () => {
    const [users, setUsers] = useState<UserResponseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Загрузка пользователей
        const fetchUsers = async () => {
            try {
                const response = await api.get('/Users');
                setUsers(response.data);
            } catch (err: unknown) {
                if (axios.isAxiosError(err)) setError('Ошибка загрузки пользователей: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    // Функция: Забанить / Разбанить
    const toggleBan = async (id: number) => {
        try {
            await api.put(`/Users/toggle-ban/${id}`);
            // Обновляем локальный стейт, чтобы кнопка сразу поменяла цвет без перезагрузки страницы
            setUsers(users.map(u => u.id === id ? { ...u, isBanned: !u.isBanned } : u));
        } catch (err) {
            if (axios.isAxiosError(err)) {
                // Теперь TS знает, что это ошибка Axios, и разрешает обращаться к err.response.data
                setError(err.response?.data?.toString() || 'Ошибка изменения статуса бана');
            } else {
                setError('Неизвестная ошибка');
            }
        }
    };

    // Функция: Сделать Админом
    const promoteUser = async (id: number) => {
        if (!window.confirm('Выдать права администратора?')) return;
        try {
            await api.put(`/Users/promote/${id}`);
            setUsers(users.map(u => u.id === id ? { ...u, roleName: 'Admin' } : u));
        } catch (err) {
            if (axios.isAxiosError(err)) {
                // Теперь TS знает, что это ошибка Axios, и разрешает обращаться к err.response.data
                setError(err.response?.data?.toString() || 'Ошибка при выдаче прав');
            } else {
                setError('Неизвестная ошибка');
            }
        }
    };

    if (loading) return <Spinner animation="border" variant="info" />;
    if (error) return <div className="alert-cyber p-3">{error}</div>;

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h4 style={{ color: 'var(--neon-cyan)' }}>База Пользователей</h4>
            <Table responsive className="table-cyber mt-3">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Идентификатор</th>
                    <th>Сеть (Email)</th>
                    <th>Допуск (Роль)</th>
                    <th>Статус</th>
                    <th>Действия</th>
                </tr>
                </thead>
                <tbody>
                {users.map(user => (
                    <tr  key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>
                            {user.roleName === 'Admin' ?
                                <Badge bg="danger">ADMIN</Badge> :
                                <Badge bg="secondary">USER</Badge>}
                        </td>
                        <td>
                            {user.isBanned ?
                                <span style={{color: 'red'}}>BANNED</span> :
                                <span style={{color: '#00ff00'}}>ACTIVE</span>}
                        </td>
                        <td>
                            <div className="d-flex gap-2">
                                <button
                                    className="btn btn-sm btn-outline-warning"
                                    onClick={() => toggleBan(user.id)}
                                    style={{ width: '100px' }}
                                >
                                    {user.isBanned ? 'РАЗБАН' : 'БАН'}
                                </button>

                                {user.roleName !== 'Admin' && (
                                    <button
                                        className="btn btn-sm btn-outline-info"
                                        onClick={() => promoteUser(user.id)}
                                    >
                                        ПОВЫСИТЬ
                                    </button>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </Table>
        </motion.div>
    );
};