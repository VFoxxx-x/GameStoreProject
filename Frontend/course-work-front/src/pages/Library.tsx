import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/axios';
import axios from 'axios';
import { Link } from 'react-router-dom';

// Описываем интерфейс, который полностью совпадает с нашим LibraryItemResponseDto из C#
interface LibraryItem {
    libraryId: number;
    gameId: number;
    gameTitle: string;
    isAvailable: boolean;
    acquiredAt: string;
    playtimeMinutes: number;
}


const Library = () => {
    const [games, setGames] = useState<LibraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Состояние для имитации "запуска" игры
    //const [playingGameId, setPlayingGameId] = useState<number | null>(null);

    // Загрузка библиотеки
    useEffect(() => {
        const fetchLibrary = async () => {
            try {
                const response = await api.get('/UserLibrary/my-games');
                setGames(response.data);
            } catch (err: unknown) {
                if (axios.isAxiosError(err)) setError('Ошибка связи с БД: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchLibrary();
    }, []);

    // Функция для красивого вывода времени (например: 125 мин -> "2 ч 5 мин")


    if (loading) return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <motion.svg width="100" height="100" viewBox="0 0 100 100"
                        animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }}>
                <rect x="25" y="25" width="50" height="50" fill="none" stroke="#fdf500" strokeWidth="2" />
                <circle cx="50" cy="50" r="35" stroke="#00f3ff" strokeWidth="4" strokeDasharray="20 40" fill="none" />
            </motion.svg>
        </Container>
    );

    return (
        <Container className="mt-4">
            <h2 className="text-uppercase mb-4 border-bottom border-info pb-2" style={{ color: 'var(--neon-cyan)' }}>
                БАЗА ЛИЦЕНЗИЙ // МОЯ БИБЛИОТЕКА
            </h2>

            {error && <div className="alert-cyber p-3 mb-4">{error}</div>}

            {games.length === 0 ? (
                // Если библиотека пуста
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-5 mt-5">
                    <h3 className="text-muted mb-4" style={{ letterSpacing: '2px' }}>СИСТЕМА: ЛИЦЕНЗИИ НЕ ОБНАРУЖЕНЫ</h3>
                    <Link to="/" className="btn btn-cyber px-4 py-2">ПЕРЕЙТИ В КАТАЛОГ</Link>
                </motion.div>
            ) : (
                // Сетка с купленными играми
                <Row xs={1} md={2} lg={3} className="g-4">
                    <AnimatePresence>
                        {games.map((game, index) => (
                            <Col key={game.libraryId}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                >
                                    <Card className="h-100 p-3" style={{ borderTop: '3px solid var(--neon-magenta)' }}>
                                        <Card.Body className="d-flex flex-column">

                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <Card.Title className="fw-bold" style={{ color: '#fff', textShadow: '0 0 5px rgba(255,255,255,0.5)' }}>
                                                    {game.gameTitle}
                                                </Card.Title>
                                                {/* Индикатор доступности игры */}
                                                {!game.isAvailable && (
                                                    <Badge bg="danger" title="Игра удалена из магазина, но лицензия активна">LEGACY</Badge>
                                                )}
                                            </div>

                                            <div className="mt-auto pt-3">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <span className="text-light" style={{ fontSize: '0.85rem', color: '#fff' }}>ПРИОБРЕТЕНО:</span>
                                                    <span className="text-light">{new Date(game.acquiredAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="d-flex flex-column gap-2 mt-3">
                                                <Link to={`/game/${game.gameId}`} className="btn btn-sm btn-outline-secondary w-100 rounded-0">
                                                    СТРАНИЦА ИГРЫ В МАГАЗИНЕ
                                                </Link>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </motion.div>
                            </Col>
                        ))}
                    </AnimatePresence>
                </Row>
            )}
        </Container>
    );
};

export default Library;