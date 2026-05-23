import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Spinner, Badge, Form } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';

// --- ИНТЕРФЕЙСЫ ---
interface GameDetailsDto {
    id: number;
    title: string;
    price: number;
    ageRating: number;
    releaseDate: string;
    description: string;
    imagePath?: string;
    genreNames?: string[];
    platformNames?: string[];
    developerNames?: string[];
    publisherNames?: string[];
}

interface CommentDto {
    commentId: number;
    authorName: string;
    message: string;
    createdAt: string;
    replies: CommentDto[];
}

const GameDetails = () => {
    const { id } = useParams(); // Берем ID игры из URL (например, /game/5)

    const [game, setGame] = useState<GameDetailsDto | null>(null);
    const [comments, setComments] = useState<CommentDto[]>([]);
    const [newComment, setNewComment] = useState('');
    // Хранит ID комментария, на который мы сейчас отвечаем
    const [replyingToId, setReplyingToId] = useState<number | null>(null);
    const [replyMessage, setReplyMessage] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Берем данные юзера из Zustand
    const { role, userName, isAuthenticated } = useAuthStore();
    const isAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : isAuthenticated;

    // --- ЗАГРУЗКА ИГРЫ И КОММЕНТАРИЕВ ---
    const fetchGameAndComments = useCallback(async () => {
        try {
            const [gameRes, commentsRes] = await Promise.all([
                api.get(`/Games/${id}`),
                api.get(`/GameDiscussions/game/${id}`)
            ]);
            setGame(gameRes.data);
            setComments(commentsRes.data);
        } catch {
            setError('Ошибка загрузки данных. Возможно, игра была удалена.');
        } finally {
            setLoading(false);
        }
    }, [id]); // функция пересоздастся, только если изменится ID игры

    // Вызываем функцию в эффекте
    useEffect(() => {
        const loadData = async () => {
            await fetchGameAndComments();
        };

        loadData();
    }, [fetchGameAndComments]);

    // --- ОТПРАВКА КОММЕНТАРИЯ ---
    const handlePostComment = async (e: React.FormEvent, parentId: number | null = null) => {
        e.preventDefault();

        // Определяем, какой текст мы сейчас отправляем (главный или ответ)
        const messageText = parentId === null ? newComment : replyMessage;
        if (!messageText.trim()) return;

        try {
            await api.post(`/GameDiscussions/${id}`, {
                message: messageText,
                parentId: parentId
            });

            // Очищаем формы после успеха
            setNewComment('');
            setReplyMessage('');
            setReplyingToId(null);

            fetchGameAndComments(); // Перезагружаем комментарии
        } catch {
            alert('Ошибка при отправке.');
        }
    };

    // --- УДАЛЕНИЕ КОММЕНТАРИЯ (Только Автор или Админ) ---
    const handleDeleteComment = async (commentId: number) => {
        if (!window.confirm('Удалить комментарий?')) return;
        try {
            await api.delete(`/GameDiscussions/${commentId}`);
            setComments(comments.filter(c => c.commentId !== commentId));
        } catch {
            alert('Нет прав на удаление или ошибка сервера.');
        }
    };

    if (loading) return <Container className="d-flex justify-content-center mt-5"><Spinner animation="border" variant="info" /></Container>;
    if (error || !game) return <Container className="mt-5"><div className="alert-cyber p-4 text-center">{error}</div></Container>;

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
        <Container className="mt-4">
            <Link to="/" className="btn btn-sm btn-outline-info mb-4">{"< НАЗАД В КАТАЛОГ"}</Link>

            {/* ======================================= */}
            {/* БЛОК 1: ДЕТАЛИ ИГРЫ */}
            {/* ======================================= */}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-4 mb-5" style={{ border: '1px solid var(--neon-cyan)' }}>
                <Row>
                    <Col lg={5} className="mb-4 mb-lg-0">

                        <img src={finalCoverSrc} alt={game.title} className="img-fluid w-100" style={{ border: '2px solid var(--neon-magenta)', boxShadow: '0 0 15px rgba(255,0,255,0.2)' }} />
                    </Col>
                    <Col lg={7}>
                        <div className="d-flex justify-content-between align-items-start border-bottom border-info pb-3 mb-3">
                            <h1 style={{ color: 'var(--neon-cyan)', textShadow: '0 0 10px rgba(0,243,255,0.3)' }}>{game.title}</h1>
                            <h2 style={{ color: 'var(--neon-yellow)' }}>{game.price} ₿</h2>
                        </div>

                        {/* ВЫВОД СПРАВОЧНИКОВ */}
                        <div className="mb-3 d-flex flex-wrap gap-2">
                            {game.genreNames?.map(g => <Badge bg="dark" key={g} className="border border-magenta" style={{ color: 'var(--neon-magenta)' }}>{g}</Badge>)}
                            {game.platformNames?.map(p => <Badge bg="dark" key={p} className="border border-info" style={{ color: 'var(--neon-cyan)' }}>{p}</Badge>)}
                        </div>

                        <Row className="mb-4 text-light">
                            <Col sm={6}>
                                <div className="mb-2"><strong className="text-info">Разработчик:</strong> {game.developerNames?.join(', ') || '-'}</div>
                                <div><strong className="text-info">Издатель:</strong> {game.publisherNames?.join(', ') || '-'}</div>
                            </Col>
                            <Col sm={6}>
                                <div className="mb-2"><strong className="text-info">Релиз:</strong> {new Date(game.releaseDate).toLocaleDateString()}</div>
                                <div><strong className="text-info">Рейтинг:</strong> {game.ageRating}+</div>
                            </Col>
                        </Row>

                        <div className="text-light" style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '15px', borderLeft: '3px solid var(--neon-yellow)' }}>
                            {game.description || 'Описание отсутствует.'}
                        </div>
                    </Col>
                </Row>
            </motion.div>

            {/* ======================================= */}
            {/* БЛОК 2: ОБСУЖДЕНИЯ (КОММЕНТАРИИ) */}
            {/* ======================================= */}
            <h3 className="mb-4" style={{ color: 'var(--neon-magenta)' }}>ТЕРМИНАЛ ОБСУЖДЕНИЙ</h3>

            {/* Форма отправки сообщения (Только для авторизованных) */}
            {isAuth ? (
                <Form onSubmit={handlePostComment} className="mb-5">
                    <Form.Group className="mb-3">
                        <Form.Control
                            as="textarea" rows={3} className="form-control-cyber"
                            placeholder="Введите ваше сообщение для других пользователей сети..."
                            value={newComment} onChange={e => setNewComment(e.target.value)} required
                        />
                    </Form.Group>
                    <div className="text-end">
                        <button type="submit" className="btn btn-cyber">ОТПРАВИТЬ ДАННЫЕ</button>
                    </div>
                </Form>
            ) : (
                <div className="alert-cyber text-center mb-5 p-3">
                    Для доступа к каналу обсуждений необходимо пройти <Link to="/auth" style={{ color: 'var(--neon-cyan)' }}>АВТОРИЗАЦИЮ</Link>.
                </div>
            )}

            {/* СПИСОК КОММЕНТАРИЕВ */}
            <div className="d-flex flex-column gap-3">
                <AnimatePresence>
                    {comments.map((comment) => {
                        const canDeleteMain = role === 'Admin' || userName === comment.authorName;

                        return (
                            <motion.div key={comment.commentId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
                                {/* --- ГЛАВНЫЙ КОММЕНТАРИЙ --- */}
                                <div className="p-3 mb-2" style={{ backgroundColor: 'rgba(0, 243, 255, 0.05)', borderLeft: '3px solid var(--neon-cyan)', border: '1px solid #111' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-2 border-bottom border-secondary pb-2">
                                        <div>
                                            <strong style={{ color: 'var(--neon-cyan)' }}>{comment.authorName}</strong>
                                            <span className="text-muted ms-3" style={{ fontSize: '0.8rem' }}>{new Date(comment.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className="d-flex gap-2">
                                            {isAuth && (
                                                <button className="btn btn-sm btn-outline-success py-0 px-2" onClick={() => setReplyingToId(comment.commentId)}>
                                                    ОТВЕТИТЬ
                                                </button>
                                            )}
                                            {canDeleteMain && (
                                                <button className="btn btn-sm btn-outline-danger py-0 px-2" onClick={() => handleDeleteComment(comment.commentId)}>X</button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-light" style={{ whiteSpace: 'pre-wrap' }}>{comment.message}</div>
                                </div>

                                {/* --- ФОРМА ДЛЯ ОТВЕТА (Появляется, если нажали "ОТВЕТИТЬ") --- */}
                                {replyingToId === comment.commentId && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="ms-4 mb-3">
                                        <Form onSubmit={(e) => handlePostComment(e, comment.commentId)} className="d-flex gap-2">
                                            <Form.Control
                                                className="form-control-cyber" size="sm"
                                                placeholder="Написать ответ..." autoFocus
                                                value={replyMessage} onChange={e => setReplyMessage(e.target.value)} required
                                            />
                                            <button type="submit" className="btn btn-sm btn-cyber">ОТПРАВИТЬ</button>
                                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setReplyingToId(null)}>ОТМЕНА</button>
                                        </Form>
                                    </motion.div>
                                )}

                                {/* --- СПИСОК ОТВЕТОВ НА ЭТОТ КОММЕНТАРИЙ --- */}
                                <div className="ms-4 mb-4" style={{ borderLeft: '2px dashed rgba(255, 0, 255, 0.3)', paddingLeft: '15px' }}>
                                    {comment.replies.map(reply => {
                                        const canDeleteReply = role === 'Admin' || userName === reply.authorName;
                                        return (
                                            <div key={reply.commentId} className="p-2 mb-2" style={{ backgroundColor: 'rgba(255, 0, 255, 0.05)', border: '1px solid #111' }}>
                                                <div className="d-flex justify-content-between align-items-center mb-1 border-bottom border-secondary pb-1">
                                                    <div>
                                                        <strong style={{ color: 'var(--neon-magenta)' }}>{reply.authorName}</strong>
                                                        <span className="text-muted ms-2" style={{ fontSize: '0.7rem' }}>{new Date(reply.createdAt).toLocaleString()}</span>
                                                    </div>
                                                    {canDeleteReply && (
                                                        <button className="btn btn-sm btn-outline-danger py-0 px-2" style={{ fontSize: '0.7rem' }} onClick={() => handleDeleteComment(reply.commentId)}>X</button>
                                                    )}
                                                </div>
                                                <div className="text-light" style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{reply.message}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {comments.length === 0 && (
                    <div className="text-center text-muted mt-3 mb-5" style={{ letterSpacing: '2px' }}>
                        В ЭТОМ СЕКТОРЕ ПОКА НЕТ ЗАПИСЕЙ
                    </div>
                )}
            </div>
        </Container>
    );
};

export default GameDetails;