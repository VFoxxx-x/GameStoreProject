import React, { useState, useEffect } from 'react';
import { Table, Spinner, Modal, Form, Row, Col } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/axios';
import axios from 'axios';

// --- ИНТЕРФЕЙСЫ ---
interface GameResponseDto {
    id: number;
    title: string;
    price: number;
    ageRating: number;
    releaseDate: string;
    description: string;
    imagePath?: string;
    genreIds?: number[];
    platformIds?: number[];
    developerIds?: number[];
    publisherIds?: number[];
}

interface DictionaryItem {
    id: number;
    title: string;
}

const initialFormState = {
    title: '',
    price: 0,
    ageRating: 0,
    releaseDate: '',
    description: '',
    imagePath: '',
    genreIds: [] as number[],
    platformIds: [] as number[],
    developerIds: [] as number[],
    publisherIds: [] as number[]
};

// =========================================================================
// МИНИ-КОМПОНЕНТ: ИНТЕРАКТИВНЫЙ ВЫБОР СПРАВОЧНИКОВ (С плюсами и минусами)
// =========================================================================
const CyberSelector = ({
                           title, availableItems, selectedIds, onUpdate, colorBorder, colorBg
                       }: {
    title: string, availableItems: DictionaryItem[], selectedIds: number[], onUpdate: (ids: number[]) => void, colorBorder: string, colorBg: string
}) => {
    const [selectedValue, setSelectedValue] = useState<string>('');

    // Добавление элемента
    const handleAdd = () => {
        const id = parseInt(selectedValue);
        if (!isNaN(id) && !selectedIds.includes(id)) {
            onUpdate([...selectedIds, id]);
        }
        setSelectedValue(''); // Сбрасываем селект
    };


    // Удаление элемента
    const handleRemove = (idToRemove: number) => {
        onUpdate(selectedIds.filter(id => id !== idToRemove));
    };

    // Фильтруем выпадающий список: показываем только то, что еще не добавлено
    const unselectedItems = availableItems.filter(item => !selectedIds.includes(item.id));



    return (
        <div className="p-3 mb-3" style={{ border: `1px solid ${colorBorder}`, backgroundColor: 'rgba(0,0,0,0.3)', position: 'relative' }}>
            <span style={{
                position: 'absolute', top: '-12px', left: '10px', backgroundColor: 'var(--dark-bg)',
                padding: '0 5px', color: colorBorder, fontWeight: 'bold', fontSize: '0.9rem'
            }}>
                {title}
            </span>

            <div className="d-flex gap-2 mb-3 mt-2">
                <Form.Select
                    className="form-control-cyber"
                    value={selectedValue}
                    onChange={(e) => setSelectedValue(e.target.value)}
                >
                    <option value="">-- Выберите из списка --</option>
                    {unselectedItems.map(item => (
                        <option key={item.id} value={item.id}>{item.title}</option>
                    ))}
                </Form.Select>
                <button type="button" className="btn btn-outline-success fw-bold px-3" onClick={handleAdd} disabled={!selectedValue}>
                    +
                </button>
            </div>

            {/* Зона выбранных элементов (Бейджи) */}
            <div className="d-flex flex-wrap gap-2">
                <AnimatePresence>
                    {selectedIds.map(id => {
                        const item = availableItems.find(i => i.id === id);
                        if (!item) return null;
                        return (
                            <motion.div
                                key={id}
                                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                                className="d-flex align-items-center px-2 py-1"
                                style={{ backgroundColor: colorBg, border: `1px solid ${colorBorder}`, color: '#fff' }}
                            >
                                <span className="me-2">{item.title}</span>
                                <button type="button" className="btn btn-sm btn-danger p-0 d-flex justify-content-center align-items-center"
                                        style={{ width: '22px', height: '22px', borderRadius: '0' }}
                                        onClick={() => handleRemove(id)}
                                >
                                    -
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {selectedIds.length === 0 && <span className="text-muted small">Элементы не выбраны</span>}
            </div>
        </div>
    );
};

// =========================================================================
// ОСНОВНОЙ КОМПОНЕНТ КАТАЛОГА ИГР
// =========================================================================
export const AdminGames = () => {
    const [games, setGames] = useState<GameResponseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [genres, setGenres] = useState<DictionaryItem[]>([]);
    const [platforms, setPlatforms] = useState<DictionaryItem[]>([]);
    const [developers, setDevelopers] = useState<DictionaryItem[]>([]);
    const [publishers, setPublishers] = useState<DictionaryItem[]>([]);

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [formData, setFormData] = useState(initialFormState);
    const [uploadingImage, setUploadingImage] = useState(false);

    const fetchData = async () => {
        try {
            const [gamesRes, genresRes, platRes, devRes, pubRes] = await Promise.all([
                api.get('/Games'), api.get('/Genres'), api.get('/Platform'), api.get('/Developer'), api.get('/Publishers')
            ]);
            setGames(gamesRes.data); setGenres(genresRes.data); setPlatforms(platRes.data); setDevelopers(devRes.data); setPublishers(pubRes.data);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) setError('Ошибка загрузки: ' + err.message);
        } finally {
            setLoading(false);
        }
    };
// eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { fetchData(); }, []);

    const handleShowAdd = () => { setFormData(initialFormState); setIsEditing(false); setEditId(null); setShowModal(true); };
    const handleClose = () => setShowModal(false);

    const handleShowEdit = (game: GameResponseDto) => {
        setFormData({
            title: game.title, price: game.price, ageRating: game.ageRating,
            releaseDate: game.releaseDate ? game.releaseDate.split('T')[0] : '',
            description: game.description || '', imagePath: game.imagePath || '',
            genreIds: game.genreIds || [], platformIds: game.platformIds || [],
            developerIds: game.developerIds || [], publisherIds: game.publisherIds || []
        });
        setIsEditing(true); setEditId(game.id); setShowModal(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- ЗАГРУЗКА КАРТИНКИ ---
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formFile = new FormData();
        formFile.append('file', file);

        // Если у игры уже была картинка, передаем старый путь для удаления сервером
        if (formData.imagePath && formData.imagePath.includes('/uploads/')) {
            formFile.append('oldPath', formData.imagePath);
        }

        setUploadingImage(true);
        try {
            const response = await api.post('/Upload/image', formFile, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // ВАЖНО: Используем стрелочную функцию (prev => ...),
            // чтобы React точно взял самые свежие данные формы, а не стер название игры!
            setFormData(prev => ({ ...prev, imagePath: response.data.url }));
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                alert('Ошибка при загрузке обложки: ' + err.response?.data);
            } else {
                alert('Сбой сети при загрузке картинки');
            }
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                releaseDate: formData.releaseDate !== '' ? formData.releaseDate : null,
                imagePath: formData.imagePath !== '' ? formData.imagePath : null,
                description: formData.description !== '' ? formData.description : null,
            };

            if (isEditing && editId !== null) await api.put(`/Games/${editId}`, payload);
            else await api.post('/Games', payload);

            fetchData();
            handleClose();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) alert("Ошибка валидации: " + JSON.stringify(err.response?.data));
            else alert('Ошибка при сохранении игры.');
        }
    };

    const handleDelete = async (id: number, title: string) => {
        if (!window.confirm(`Вы уверены, что хотите удалить игру "${title}"?`)) return;
        try { await api.delete(`/Games/${id}`); setGames(games.filter(g => g.id !== id)); }
        catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                // Теперь TS знает, что это ошибка Axios, и разрешает обращаться к err.response.data
                setError(err.response?.data?.toString() || 'Ошибка при удалении');
            } else {
                setError('Неизвестная ошибка');
            }
        }
    };

    if (loading) return <Spinner animation="border" variant="info" />;
    if (error) return <div className="alert-cyber p-3">{error}</div>;

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 style={{ color: 'var(--neon-cyan)' }}>Управление каталогом</h4>
                <button className="btn btn-cyber" onClick={handleShowAdd}>+ ДОБАВИТЬ ИГРУ</button>
            </div>

            <Table responsive className="table-cyber mt-3">
                <thead>
                <tr>
                    <th>ID</th><th>Название</th><th>Цена</th><th>Действия</th>
                </tr>
                </thead>
                <tbody>
                {games.map(game => (
                    <tr key={game.id}>
                        <td>{game.id}</td>
                        <td className="fw-bold text-info">{game.title}</td>
                        <td><span style={{ color: 'var(--neon-yellow)' }}>{game.price} ₿</span></td>
                        <td>
                            <div className="d-flex gap-2">
                                <button className="btn btn-sm btn-outline-info" onClick={() => handleShowEdit(game)}>ИЗМЕНИТЬ</button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(game.id, game.title)}>УДАЛИТЬ</button>
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </Table>

            {/* === ОБНОВЛЕННОЕ МОДАЛЬНОЕ ОКНО === */}
            <Modal show={showModal} onHide={handleClose} size="xl" contentClassName="bg-dark border-info">
                <Modal.Header closeButton closeVariant="white" className="border-bottom border-info">
                    <Modal.Title style={{ color: 'var(--neon-magenta)' }}>{isEditing ? 'РЕДАКТИРОВАНИЕ' : 'НОВАЯ ЗАПИСЬ'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-light">
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            {/* ЛЕВАЯ КОЛОНКА (Текст и даты) */}
                            <Col md={5}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-info">Название</Form.Label>
                                    <Form.Control className="form-control-cyber" name="title" value={formData.title} onChange={handleChange} required />
                                </Form.Group>
                                <Row>
                                    <Col xs={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="text-info">Цена (₿)</Form.Label>
                                            <Form.Control className="form-control-cyber" type="number" name="price" value={formData.price} onChange={handleChange} required min="0" />
                                        </Form.Group>
                                    </Col>
                                    <Col xs={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="text-info">Рейтинг</Form.Label>
                                            <Form.Control className="form-control-cyber" type="number" name="ageRating" value={formData.ageRating} onChange={handleChange} min="0" max="21" />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-info">Дата релиза</Form.Label>
                                    <Form.Control className="form-control-cyber" type="date" name="releaseDate" value={formData.releaseDate} onChange={handleChange} />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-info">Обложка (Файл)</Form.Label>
                                    <div className="d-flex align-items-center gap-3">
                                        <Form.Control
                                            className="form-control-cyber"
                                            type="file"
                                            accept="image/png, image/jpeg, image/webp"
                                            onChange={handleImageUpload}
                                            disabled={uploadingImage}
                                        />
                                        {uploadingImage && <Spinner animation="border" size="sm" variant="info" />}
                                    </div>

                                    {/* Предпросмотр картинки: если файл загружен, показываем его миниатюру */}
                                    {formData.imagePath && (
                                        <div className="mt-2 p-2" style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px dashed var(--neon-cyan)' }}>
                                            <small className="text-success d-block mb-1">Файл прикреплен:</small>
                                            <img
                                                src={formData.imagePath.startsWith('/') ? `http://localhost:5070${formData.imagePath}` : formData.imagePath}
                                                alt="Preview"
                                                style={{ height: '80px', objectFit: 'contain' }}
                                            />
                                        </div>
                                    )}
                                </Form.Group>
                                <Form.Group className="mb-4">
                                    <Form.Label className="text-info">Описание игры</Form.Label>
                                    <Form.Control as="textarea" rows={4} className="form-control-cyber" name="description" value={formData.description} onChange={handleChange} />
                                </Form.Group>
                            </Col>

                            {/* ПРАВАЯ КОЛОНКА (Новые интерактивные справочники) */}
                            <Col md={7}>
                                <Row>
                                    <Col lg={6}>
                                        <CyberSelector
                                            title="ЖАНРЫ"
                                            availableItems={genres}
                                            selectedIds={formData.genreIds}
                                            onUpdate={(ids) => setFormData({...formData, genreIds: ids})}
                                            colorBorder="var(--neon-magenta)"
                                            colorBg="rgba(255, 0, 255, 0.15)"
                                        />
                                    </Col>
                                    <Col lg={6}>
                                        <CyberSelector
                                            title="ПЛАТФОРМЫ"
                                            availableItems={platforms}
                                            selectedIds={formData.platformIds}
                                            onUpdate={(ids) => setFormData({...formData, platformIds: ids})}
                                            colorBorder="var(--neon-cyan)"
                                            colorBg="rgba(0, 243, 255, 0.15)"
                                        />
                                    </Col>
                                    <Col lg={6}>
                                        <CyberSelector
                                            title="РАЗРАБОТЧИКИ"
                                            availableItems={developers}
                                            selectedIds={formData.developerIds}
                                            onUpdate={(ids) => setFormData({...formData, developerIds: ids})}
                                            colorBorder="var(--neon-yellow)"
                                            colorBg="rgba(253, 245, 0, 0.15)"
                                        />
                                    </Col>
                                    <Col lg={6}>
                                        <CyberSelector
                                            title="ИЗДАТЕЛИ"
                                            availableItems={publishers}
                                            selectedIds={formData.publisherIds}
                                            onUpdate={(ids) => setFormData({...formData, publisherIds: ids})}
                                            colorBorder="#00ff00" // Neon Green
                                            colorBg="rgba(0, 255, 0, 0.15)"
                                        />
                                    </Col>
                                </Row>
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-end gap-3 mt-3 border-top border-info pt-3">
                            <button type="button" className="btn btn-outline-secondary" onClick={handleClose}>ОТМЕНА</button>
                            <button type="submit" className="btn btn-cyber">
                                {isEditing ? 'ОБНОВИТЬ БАЗУ' : 'ДОБАВИТЬ В БАЗУ'}
                            </button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </motion.div>
    );
};