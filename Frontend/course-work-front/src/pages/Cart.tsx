import { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/axios';
import axios from 'axios';
import { Link } from 'react-router-dom';

// 1. Описываем интерфейсы согласно нашему DTO из бэкенда
interface CartItem {
    cartId: number;
    gameId: number;
    gameTitle: string;
    price: number;
    addedAt: string;
}

const Cart = () => {
    // Состояния корзины
    const [items, setItems] = useState<CartItem[]>([]);
    const [totalAmount, setTotalAmount] = useState<number>(0);

    // Состояния интерфейса
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [error, setError] = useState('');
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);

    // 2. Загрузка корзины при открытии страницы
    useEffect(() => {
        const fetchCart = async () => {
            try {
                const response = await api.get('/Cart');
                setItems(response.data.items);
                setTotalAmount(response.data.totalAmount);
            } catch (err: unknown) {
                if (axios.isAxiosError(err)) setError('Ошибка связи с БД: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCart();
    }, []);

    // 3. Удаление одного товара
    const handleRemoveItem = async (cartId: number, price: number) => {
        try {
            // Мгновенный отклик интерфейса (Оптимистичный UI)
            setItems(prev => prev.filter(item => item.cartId !== cartId));
            setTotalAmount(prev => prev - price);

            // Фоновый запрос на сервер
            await api.delete(`/Cart/remove/${cartId}`);
        } catch {
            alert('Ошибка при удалении товара. Данные рассинхронизированы.');
            window.location.reload(); // Перезагружаем страницу для синхронизации, если сервер упал
        }
    };

    // 4. Очистка всей корзины
    const handleClearCart = async () => {
        if (!window.confirm('Внимание: Корзина будет полностью очищена. Продолжить?')) return;
        try {
            setItems([]);
            setTotalAmount(0);
            await api.delete('/Cart/clear');
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                // TS знает, что это ошибка Axios, и разрешает обращаться к err.response.data
                setError(err.response?.data?.toString() || 'Ошибка очистки');
            } else {
                setError('Неизвестная ошибка');
            }
        }
    };

    // 5. Оформление заказа (CHECKOUT)
    const handleCheckout = async () => {
        setCheckoutLoading(true);
        setError('');
        try {
            await api.post('/Cart/checkout');
            setCheckoutSuccess(true);
            setItems([]); // Очищаем интерфейс
            setTotalAmount(0);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.toString() || 'Ошибка транзакции');
            }
        } finally {
            setCheckoutLoading(false);
        }
    };

    // --- РЕНДЕРИНГ ---

    if (loading) return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <Spinner animation="grow" style={{ color: 'var(--neon-cyan)' }} />
        </Container>
    );

    // Экран успешной покупки
    if (checkoutSuccess) return (
        <Container className="mt-5 text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-5 border-success">
                <h1 style={{ color: '#00ff00', textShadow: '0 0 15px #00ff00' }}>ТРАНЗАКЦИЯ ОДОБРЕНА</h1>
                <p className="text-light mt-3 fs-5">
                    Средства списаны. Лицензии на игры успешно добавлены в вашу Библиотеку.
                </p>
                <div className="mt-4">
                    <Link to="/library" className="btn btn-cyber me-3" style={{ borderColor: '#00ff00', color: '#00ff00' }}>
                        ОТКРЫТЬ БИБЛИОТЕКУ
                    </Link>
                    <Link to="/" className="btn btn-outline-info">
                        В КАТАЛОГ
                    </Link>
                </div>
            </motion.div>
        </Container>
    );

    return (
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-info pb-2">
                <h2 className="text-uppercase mb-0" style={{ color: 'var(--neon-magenta)' }}>
                    ТЕРМИНАЛ ОПЛАТЫ // КОРЗИНА
                </h2>
                {items.length > 0 && (
                    <button className="btn btn-sm btn-outline-danger" onClick={handleClearCart}>
                        [ ОЧИСТИТЬ ДАННЫЕ ]
                    </button>
                )}
            </div>

            {error && <div className="alert-cyber p-3 mb-4">{error}</div>}

            {items.length === 0 ? (
                // Если корзина пуста
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-5">
                    <h3 className="text-muted" style={{ letterSpacing: '3px' }}>КОРЗИНА ПУСТА // НЕТ ДАННЫХ</h3>
                    <Link to="/" className="btn btn-cyber mt-4">ВЕРНУТЬСЯ В КАТАЛОГ</Link>
                </motion.div>
            ) : (
                // Если в корзине есть игры
                <Row>
                    <Col lg={8}>
                        <AnimatePresence>
                            {items.map((item, index) => (
                                <motion.div
                                    key={item.cartId}
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 50, scale: 0.9 }} // Анимация удаления товара
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="card mb-3 p-3 flex-row justify-content-between align-items-center"
                                    style={{ borderLeft: '4px solid var(--neon-cyan)' }}
                                >
                                    <div>
                                        <h4 className="mb-1 text-light">{item.gameTitle}</h4>
                                        <Badge bg="dark" className="border border-secondary text-muted">
                                            <span className="text-white ms-1"> ДОБАВЛЕНО: {new Date(item.addedAt).toLocaleDateString()}</span>
                                        </Badge>
                                    </div>
                                    <div className="d-flex align-items-center gap-4">
                                        <h4 className="mb-0" style={{ color: 'var(--neon-yellow)' }}>
                                            {item.price} ₿
                                        </h4>
                                        <button
                                            className="btn btn-outline-danger rounded-0"
                                            onClick={() => handleRemoveItem(item.cartId, item.price)}
                                            title="Удалить из корзины"
                                        >
                                            X
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </Col>

                    {/* БЛОК ИТОГО К ОПЛАТЕ */}
                    <Col lg={4}>
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card p-4 position-sticky"
                            style={{ top: '80px', border: '1px solid var(--neon-yellow)' }}
                        >
                            <h4 className="border-bottom border-secondary pb-2 text-light">СВОДКА ЗАКАЗА</h4>
                            <div className="d-flex justify-content-between mt-3 mb-2">
                                <span className="text-muted">Количество лицензий:</span>
                                <span className="text-light">{items.length} шт.</span>
                            </div>
                            <div className="d-flex justify-content-between mb-4">
                                <span className="text-muted">Налоги сети:</span>
                                <span className="text-light">0.00 ₿</span>
                            </div>

                            <hr style={{ borderColor: 'var(--neon-yellow)' }} />

                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <span className="fs-5 text-light">ИТОГО:</span>
                                <span className="fs-2 fw-bold" style={{ color: 'var(--neon-yellow)', textShadow: '0 0 10px var(--neon-yellow)' }}>
                                    {totalAmount} ₿
                                </span>
                            </div>

                            <button
                                className="btn btn-cyber w-100 py-3 fs-5"
                                style={{ backgroundColor: 'rgba(253, 245, 0, 0.1)' }}
                                onClick={handleCheckout}
                                disabled={checkoutLoading}
                            >
                                {checkoutLoading ? <Spinner animation="border" size="sm" /> : 'ПОДТВЕРДИТЬ ТРАНЗАКЦИЮ'}
                            </button>
                        </motion.div>
                    </Col>
                </Row>
            )}
        </Container>
    );
};

export default Cart;