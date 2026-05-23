import {useEffect, useState} from "react";
import {api} from "../api/axios.ts";
import { motion } from "framer-motion";
import {Col, Form, Row, Spinner} from "react-bootstrap";

interface UserDto {
    id: number;
    username: string;
    email: string;
}

export const AdminSendNotification = () => {
    const [users, setUsers] = useState<UserDto[]>([]);
    const [formData, setFormData] = useState({ targetUserId: '', title: '', message: '', type: 'Info' });
    const [loading, setLoading] = useState(false);

    // Загружаем список юзеров, чтобы админ мог выбрать кому слать
    useEffect(() => {
        api.get('/Users').then(res => setUsers(res.data)).catch(err => console.log(err));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/Notifications/send', {
                targetUserId: parseInt(formData.targetUserId),
                title: formData.title,
                message: formData.message,
                type: formData.type
            });
            alert('УВЕДОМЛЕНИЕ УСПЕШНО ОТПРАВЛЕНО!');
            setFormData({ ...formData, title: '', message: '' }); // Очищаем текст
        } catch {
            alert('Ошибка отправки. Проверьте данные.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h4 style={{ color: 'var(--neon-cyan)', marginBottom: '20px' }}>РАССЫЛКА ОПОВЕЩЕНИЙ</h4>

            <Form onSubmit={handleSubmit} className="p-4" style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--neon-cyan)' }}>
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-info">Получатель (Пользователь)</Form.Label>
                            <Form.Select
                                className="form-control-cyber"
                                required
                                value={formData.targetUserId}
                                onChange={(e) => setFormData({...formData, targetUserId: e.target.value})}
                            >
                                <option value="">-- Выберите пользователя --</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>ID: {u.id} | {u.username} ({u.email})</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-info">Тип сообщения (Цвет)</Form.Label>
                            <Form.Select
                                className="form-control-cyber"
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                            >
                                <option value="Info">Информация (Голубой)</option>
                                <option value="Success">Успех (Зеленый)</option>
                                <option value="Warning">Предупреждение (Красный)</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>

                <Form.Group className="mb-3">
                    <Form.Label className="text-info">Заголовок сообщения</Form.Label>
                    <Form.Control
                        className="form-control-cyber"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                </Form.Group>

                <Form.Group className="mb-4">
                    <Form.Label className="text-info">Текст сообщения</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={4}
                        className="form-control-cyber"
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                    />
                </Form.Group>

                <button type="submit" className="btn btn-cyber w-100 py-2" disabled={loading}>
                    {loading ? <Spinner size="sm" animation="border"/> : 'ОТПРАВИТЬ СООБЩЕНИЕ'}
                </button>
            </Form>
        </motion.div>
    );
};