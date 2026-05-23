import { useState, useEffect } from 'react';
import { Table, Spinner, Badge, Modal, Button } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { api } from '../api/axios';
import axios from 'axios';

// --- ИНТЕРФЕЙСЫ (соответствуют OrderResponseDto на бэкенде) ---
interface OrderItemDto {
    gameTitle: string;
    priceAtPurchase: number;
    quantity: number;
}

interface OrderDto {
    orderId: number;
    customerName: string;
    date: string;
    totalAmount: number;
    status: string; // 'Paid', 'Refunded', 'Canceled'
    items: OrderItemDto[];
}

export const AdminOrders = () => {
    const [orders, setOrders] = useState<OrderDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Состояния для модального окна просмотра чека
    const [showModal, setShowModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);

    // Загрузка всех заказов
    const fetchOrders =  async () => {
        try {
            const response = await api.get('/Orders/all');
            setOrders(response.data);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) setError('Ошибка загрузки заказов: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchOrders().catch(console.error);
    }, []);

    // Изменение статуса заказа (Возврат / Отмена)
    const handleStatusChange = async (orderId: number, newStatus: string) => {
        const actionName = newStatus === 'Refunded' ? 'ОФОРМИТЬ ВОЗВРАТ (Игры будут отозваны)' : 'ИЗМЕНИТЬ СТАТУС';
        if (!window.confirm(`ВНИМАНИЕ! Вы хотите ${actionName} для заказа #${orderId}?`)) return;

        try {
            // На бэкенде мы ожидаем объект { newStatus: "Refunded" }
            await api.put(`/Orders/${orderId}/status`, { newStatus });

            // Оптимистичное обновление UI
            setOrders(orders.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o));
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                alert('Ошибка: ' + JSON.stringify(err.response?.data));
            } else {
                alert('Ошибка при изменении статуса.');
            }
        }
    };

    // Открытие деталей чека
    const handleViewDetails = (order: OrderDto) => {
        setSelectedOrder(order);
        setShowModal(true);
    };

    // Вспомогательная функция для красивого цвета статуса
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Paid': return <Badge bg="success" className="px-3 py-2">ОПЛАЧЕН</Badge>;
            case 'Refunded': return <Badge bg="danger" className="px-3 py-2">ВОЗВРАТ</Badge>;
            case 'Canceled': return <Badge bg="secondary" className="px-3 py-2">ОТМЕНЕН</Badge>;
            default: return <Badge bg="info">{status}</Badge>;
        }
    };

    if (loading) return <Spinner animation="border" variant="info" />;
    if (error) return <div className="alert-cyber p-3">{error}</div>;

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h4 style={{ color: 'var(--neon-cyan)' }} className="mb-4">ФИНАНСОВЫЙ ТЕРМИНАЛ // ЗАКАЗЫ</h4>

            <Table responsive className="table-cyber mt-3">
                <thead>
                <tr>
                    <th>ID Чека</th>
                    <th>Покупатель</th>
                    <th>Дата транзакции</th>
                    <th>Сумма (₿)</th>
                    <th>Статус</th>
                    <th className="text-end">Действия</th>
                </tr>
                </thead>
                <tbody>
                {orders.map(order => (
                    <tr key={order.orderId}>
                        <td className="fw-bold text-light">#{order.orderId}</td>
                        <td style={{ color: 'var(--neon-cyan)' }}>{order.customerName}</td>
                        <td className="text-muted">{new Date(order.date).toLocaleString()}</td>
                        <td className="fw-bold" style={{ color: 'var(--neon-yellow)' }}>{order.totalAmount}</td>
                        <td>{getStatusBadge(order.status)}</td>
                        <td className="text-end">
                            <Button
                                variant="outline-info"
                                size="sm"
                                className="me-2 rounded-0"
                                onClick={() => handleViewDetails(order)}
                            >
                                ЧЕК
                            </Button>

                            {/* Кнопка возврата доступна только если заказ Оплачен */}
                            {order.status === 'Paid' && (
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="rounded-0"
                                    onClick={() => handleStatusChange(order.orderId, 'Refunded')}
                                >
                                    ВЕРНУТЬ СРЕДСТВА
                                </Button>
                            )}
                        </td>
                    </tr>
                ))}
                {orders.length === 0 && (
                    <tr>
                        <td colSpan={6} className="text-center text-muted py-4">ТРАНЗАКЦИЙ НЕ ОБНАРУЖЕНО</td>
                    </tr>
                )}
                </tbody>
            </Table>

            {/* МОДАЛЬНОЕ ОКНО С ДЕТАЛЯМИ ЧЕКА */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" contentClassName="bg-dark border-info">
                <Modal.Header closeButton closeVariant="white" className="border-bottom border-info">
                    <Modal.Title style={{ color: 'var(--neon-magenta)' }}>
                        ДЕТАЛИЗАЦИЯ ЧЕКА #{selectedOrder?.orderId}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-light">
                    {selectedOrder && (
                        <>
                            <div className="mb-4 p-3" style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderLeft: '4px solid var(--neon-cyan)' }}>
                                <div className="mb-1"><span className="text-info">ПОКУПАТЕЛЬ:</span> <strong className="text-info">{selectedOrder.customerName}</strong></div>
                                <div className="mb-1"><span className="text-info">ДАТА:</span> {new Date(selectedOrder.date).toLocaleString()}</div>
                                <div className="mb-1"><span className="text-info">СТАТУС:</span> {getStatusBadge(selectedOrder.status)}</div>
                            </div>

                            <h5 style={{ color: 'var(--neon-yellow)' }} className="mb-3">ПРИОБРЕТЕННЫЕ ЛИЦЕНЗИИ:</h5>
                            <Table variant="dark" bordered hover style={{ borderColor: '#333' }}>
                                <thead>
                                <tr>
                                    <th className="text-info">Название игры</th>
                                    <th className="text-info text-center">Кол-во</th>
                                    <th className="text-info text-end">Цена на момент покупки</th>
                                </tr>
                                </thead>
                                <tbody>
                                {selectedOrder.items.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.gameTitle}</td>
                                        <td className="text-center">{item.quantity}</td>
                                        <td className="text-end" style={{ color: 'var(--neon-yellow)' }}>{item.priceAtPurchase} ₿</td>
                                    </tr>
                                ))}
                                </tbody>
                                <tfoot>
                                <tr>
                                    <td colSpan={2} className="text-end fw-bold">ИТОГО:</td>
                                    <td className="text-end fw-bold" style={{ color: 'var(--neon-magenta)', fontSize: '1.2rem' }}>
                                        {selectedOrder.totalAmount} ₿
                                    </td>
                                </tr>
                                </tfoot>
                            </Table>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-top border-info">
                    <Button variant="outline-secondary" onClick={() => setShowModal(false)}>ЗАКРЫТЬ</Button>
                </Modal.Footer>
            </Modal>
        </motion.div>
    );
};