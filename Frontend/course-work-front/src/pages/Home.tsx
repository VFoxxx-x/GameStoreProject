import { useEffect, useState } from 'react';
import { Card, Row, Col, Container, Spinner, Form, Badge } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import axios from 'axios';

// --- ИНТЕРФЕЙСЫ ---
interface Game {
    id: number;
    title: string;
    price: number;
    description: string;
    imagePath?: string;
    genreNames?: string[];
    platformNames?: string[];
    developerNames?: string[];
}

interface DictionaryItem {
    id: number;
    title: string;
}

const Home = () => {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingGameId, setAddingGameId] = useState<number | null>(null);

    // Состояния справочников для фильтров
    const [genres, setGenres] = useState<DictionaryItem[]>([]);
    const [platforms, setPlatforms] = useState<DictionaryItem[]>([]);
    const [developers, setDevelopers] = useState<DictionaryItem[]>([]);
    const [publishers, setPublishers] = useState<DictionaryItem[]>([]);

    // --- СОСТОЯНИЯ ФИЛЬТРОВ ---
    const [search, setSearch] = useState('');
    const [genreId, setGenreId] = useState('');
    const [platformId, setPlatformId] = useState('');
    const [developerId, setDeveloperId] = useState('');
    const [publisherId, setPublisherId] = useState('');
    const [maxAgeRating, setMaxAgeRating] = useState('');
    const [releaseYear, setReleaseYear] = useState('');
    const [sortBy, setSortBy] = useState(''); // '' (алфавит) или 'newest'

    // Переключатель видимости панели фильтров
    const [showFilters, setShowFilters] = useState(false);

    const navigate = useNavigate();
    const isAuth = useAuthStore(state => typeof state.isAuthenticated === 'function' ? state.isAuthenticated() : state.isAuthenticated);

    // 1. Загрузка справочников (1 раз при открытии страницы)
    useEffect(() => {
        const fetchDictionaries = async () => {
            try {
                const [gen, plat, dev, pub] = await Promise.all([
                    api.get('/Genres'), api.get('/Platform'), api.get('/Developer'), api.get('/Publishers')
                ]);
                setGenres(gen.data); setPlatforms(plat.data); setDevelopers(dev.data); setPublishers(pub.data);
            } catch  { console.error("Ошибка загрузки справочников"); }
        };
        fetchDictionaries();
    }, []);

    // 2. Загрузка игр (Срабатывает каждый раз, когда меняется любой фильтр!)
    useEffect(() => {
        const fetchGames = async () => {
            setLoading(true);
            try {
                // Передаем параметры как Query String
                const response = await api.get('/Games', {
                    params: {
                        search: search || null,
                        genreId: genreId || null,
                        platformId: platformId || null,
                        developerId: developerId || null,
                        publisherId: publisherId || null,
                        maxAgeRating: maxAgeRating || null,
                        releaseYear: releaseYear || null,
                        sortBy: sortBy || null
                    }
                });
                setGames(response.data);
            } catch (error) {
                console.error("Ошибка загрузки игр", error);
            } finally {
                setLoading(false);
            }
        };

        // Задержка (Debounce) на 500мс, чтобы не спамить запросами пока человек печатает текст
        const delayDebounceFn = setTimeout(() => {
            fetchGames();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [search, genreId, platformId, developerId, publisherId, maxAgeRating, releaseYear, sortBy]);

    // Сброс фильтров
    const handleClearFilters = () => {
        setSearch(''); setGenreId(''); setPlatformId(''); setDeveloperId('');
        setPublisherId(''); setMaxAgeRating(''); setReleaseYear(''); setSortBy('');
    };

    // Добавление в корзину
    const handleAddToCart = async (gameId: number) => {
        if (!isAuth) { navigate('/auth'); return; }
        setAddingGameId(gameId);
        try {
            await api.post(`/Cart/add/${gameId}`);
            alert('УСПЕШНО: Игра добавлена в корзину!');
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) alert('ОШИБКА: ' + (err.response?.data || 'Сбой подключения'));
        } finally {
            setAddingGameId(null);
        }
    };

    // Создаем массив годов от 2000 до текущего года (для селекта)
    const currentYear = new Date().getFullYear();
    const years = Array.from(new Array(currentYear - 1999), (_, index) => currentYear - index);

    // Функция для отправки картинки


    return (
        <Container>
            {/* === ВЕРХНЯЯ ПАНЕЛЬ: ПОИСК И СОРТИРОВКА === */}
            <div className="d-flex justify-content-between align-items-end mb-4 border-bottom border-info pb-3">
                <h1 className="text-uppercase m-0" style={{ color: 'var(--neon-magenta)' }}>Каталог // Neural_Net</h1>

                <div className="d-flex gap-2">
                    <button className="btn btn-outline-info" onClick={() => setShowFilters(!showFilters)}>
                        {showFilters ? 'СКРЫТЬ ФИЛЬТРЫ' : 'ФИЛЬТРЫ'}
                    </button>
                    <button
                        className={`btn ${sortBy === 'newest' ? 'btn-cyber' : 'btn-outline-secondary'}`}
                        onClick={() => setSortBy(sortBy === 'newest' ? '' : 'newest')}
                        style={sortBy === 'newest' ? { borderColor: 'var(--neon-yellow)', color: 'var(--neon-yellow)' } : {}}
                    >
                        САМЫЕ НОВЫЕ
                    </button>
                </div>
            </div>

            {/* === ПАНЕЛЬ ФИЛЬТРОВ (АНИМИРОВАННАЯ) === */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mb-4 p-3" style={{ backgroundColor: 'rgba(0, 243, 255, 0.05)', border: '1px solid var(--neon-cyan)' }}
                    >
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Control className="form-control-cyber" placeholder="Поиск по названию..." value={search} onChange={e => setSearch(e.target.value)} />
                            </Col>
                            <Col md={3}>
                                <Form.Select className="form-control-cyber" value={genreId} onChange={e => setGenreId(e.target.value)}>
                                    <option value="">Все жанры</option>
                                    {genres.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                                </Form.Select>
                            </Col>
                            <Col md={3}>
                                <Form.Select className="form-control-cyber" value={platformId} onChange={e => setPlatformId(e.target.value)}>
                                    <option value="">Все платформы</option>
                                    {platforms.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </Form.Select>
                            </Col>
                            <Col md={3}>
                                <Form.Select className="form-control-cyber" value={developerId} onChange={e => setDeveloperId(e.target.value)}>
                                    <option value="">Все разработчики</option>
                                    {developers.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                                </Form.Select>
                            </Col>
                            <Col md={3}>
                                <Form.Select className="form-control-cyber" value={publisherId} onChange={e => setPublisherId(e.target.value)}>
                                    <option value="">Все издатели</option>
                                    {publishers.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </Form.Select>
                            </Col>
                            <Col md={3}>
                                <Form.Select className="form-control-cyber" value={releaseYear} onChange={e => setReleaseYear(e.target.value)}>
                                    <option value="">Год выхода</option>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </Form.Select>
                            </Col>
                            <Col md={3}>
                                <Form.Select className="form-control-cyber" value={maxAgeRating} onChange={e => setMaxAgeRating(e.target.value)}>
                                    <option value="">Возрастной рейтинг</option>
                                    <option value="6">До 6+ лет</option>
                                    <option value="12">До 12+ лет</option>
                                    <option value="16">До 16+ лет</option>
                                    <option value="18">До 18+ лет</option>
                                </Form.Select>
                            </Col>
                            <Col md={6} className="d-flex align-items-end justify-content-end">
                                <button className="btn btn-outline-danger" onClick={handleClearFilters}>[ СБРОСИТЬ ФИЛЬТРЫ ]</button>
                            </Col>
                        </Row>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* === ВЫВОД ИГР === */}
            {loading ? (
                <div className="d-flex justify-content-center mt-5"><Spinner animation="grow" style={{ color: 'var(--neon-cyan)' }} /></div>
            ) : games.length === 0 ? (
                <div className="text-center text-muted mt-5 py-5" style={{ letterSpacing: '2px' }}>ПО ВАШЕМУ ЗАПРОСУ НИЧЕГО НЕ НАЙДЕНО</div>
            ) : (
                <Row xs={1} md={2} lg={3} className="g-4 mb-5">
                    {games.map((game, index) => {
                        const coverSrc = `http://via.placeholder.com/400x200/05050a/00f3ff?text=${game.title}`;
                        let finalCoverSrc = coverSrc;
                        if (game?.imagePath) {
                            if (game.imagePath.startsWith('/')) {
                                finalCoverSrc = `http://localhost:5070${game.imagePath}`;
                            } else {
                                finalCoverSrc = game.imagePath;
                            }
                        }
                        return (
                            <Col key={game.id}>
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="h-100">
                                    <Card className="h-100 p-2">
                                        <Card.Img variant="top" src={finalCoverSrc} style={{ height: '180px', objectFit: 'cover', border: '1px solid var(--neon-cyan)' }} />
                                        <Card.Body className="d-flex flex-column px-2">
                                            <Card.Title className="fw-bold" style={{ color: 'var(--neon-cyan)' }}>{game.title}</Card.Title>

                                            <div className="mb-2">
                                                {game.genreNames?.map(g => <Badge bg="dark" key={g} className="border border-magenta me-1" style={{ color: 'var(--neon-magenta)' }}>{g}</Badge>)}
                                                {game.platformNames?.map(p => <Badge bg="dark" key={p} className="border border-info me-1" style={{ color: 'var(--neon-cyan)' }}>{p}</Badge>)}
                                            </div>

                                            <div className="fw-bold" style={{ color: 'var(--neon-cyan)'}}>Разработчик: {game.developerNames?.join(', ') || 'Неизвестен'}</div>

                                            <h4 className="mt-auto" style={{ color: 'var(--neon-yellow)' }}>{game.price} ₿</h4>

                                            <div className="d-flex gap-2 mt-3">
                                                <Link to={`/game/${game.id}`} className="btn btn-outline-info w-50" style={{ borderRadius: '0' }}>ПОДРОБНЕЕ</Link>
                                                <button className="btn btn-cyber w-50" onClick={() => handleAddToCart(game.id)} disabled={addingGameId === game.id}>
                                                    {addingGameId === game.id ? <Spinner animation="border" size="sm" /> : 'В КОРЗИНУ'}
                                                </button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </motion.div>
                            </Col>
                        );
                    })}
                </Row>
            )}
        </Container>
    );
};

export default Home;