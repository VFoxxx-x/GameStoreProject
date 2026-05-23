import React, { useState, useEffect } from 'react';
import { Table, Spinner, Modal, Form } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { api } from '../api/axios';
import axios from 'axios';

interface AdminDictionaryProps {
    title: string;
    endpoint: string;
    // Настройки для второго поля
    secondFieldKey?: 'description' | 'type';
    secondFieldLabel?: string;
}

interface DictionaryItem {
    id: number;
    title: string;
    description?: string;
    type?: string;
}

export const AdminDictionary: React.FC<AdminDictionaryProps> = ({
                                                                    title,
                                                                    endpoint,
                                                                    secondFieldKey = 'description', // По умолчанию шлем description
                                                                    secondFieldLabel = 'Описание'   // По умолчанию пишем "Описание"
                                                                }) => {
    const [items, setItems] = useState<DictionaryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    // В стейте используем универсальное название secondValue
    const [formData, setFormData] = useState({ title: '', secondValue: '' });

    const fetchItems = async () => {
        try {
            const response = await api.get(endpoint);
            setItems(response.data);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) setError(`Ошибка загрузки ${title}: ` + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchItems();
    }, [endpoint]);

    const handleShowAdd = () => {
        setFormData({ title: '', secondValue: '' });
        setIsEditing(false);
        setEditId(null);
        setShowModal(true);
    };

    const handleShowEdit = (item: DictionaryItem) => {
        // Динамически читаем нужное поле из объекта (item.description или item.type)
        setFormData({ title: item.title, secondValue: item[secondFieldKey] || '' });
        setIsEditing(true);
        setEditId(item.id);
        setShowModal(true);
    };

    const handleClose = () => setShowModal(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Динамически собираем JSON для отправки на сервер
            const payload = {
                title: formData.title,
                [secondFieldKey]: formData.secondValue // Превратится в "description": "..." ИЛИ "type": "..."
            };

            if (isEditing && editId !== null) {
                await api.put(`${endpoint}/${editId}`, payload);
            } else {
                await api.post(endpoint, payload);
            }
            fetchItems();
            handleClose();
        } catch (err: unknown) {

            if (axios.isAxiosError(err)) {
                // Теперь TS знает, что это ошибка Axios, и разрешает обращаться к err.response.data
                setError(err.response?.data?.toString() || 'Ошибка сохранения');
            } else {
                setError('Неизвестная ошибка');
            }
        }
    };

    const handleDelete = async (id: number, itemTitle: string) => {
        if (!window.confirm(`ВНИМАНИЕ! Удалить "${itemTitle}"? Все связанные игры потеряют эту метку!`)) return;
        try {
            await api.delete(`${endpoint}/${id}`);
            setItems(items.filter(i => i.id !== id));
        } catch (err: unknown) {
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
                <h4 style={{ color: 'var(--neon-cyan)' }}>Управление: {title}</h4>
                <button className="btn btn-cyber" onClick={handleShowAdd}>+ ДОБАВИТЬ</button>
            </div>

            <Table responsive className="table-cyber mt-3">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Название</th>
                    <th>{secondFieldLabel}</th> {/* Динамический заголовок */}
                    <th className="text-end">Действия</th>
                </tr>
                </thead>
                <tbody>
                {items.map(item => (
                    <tr key={item.id}>
                        <td>{item.id}</td>
                        <td className="fw-bold" style={{ color: 'var(--neon-yellow)' }}>{item.title}</td>
                        {/* Убрали text-muted, поставили белый текст с легкой прозрачностью */}
                        <td style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                            {item[secondFieldKey] || '-'}
                        </td>
                        <td className="text-end">
                            <button className="btn btn-sm btn-outline-info me-2" onClick={() => handleShowEdit(item)}>
                                ИЗМЕНИТЬ
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id, item.title)}>
                                УДАЛИТЬ
                            </button>
                        </td>
                    </tr>
                ))}
                {items.length === 0 && (
                    <tr>
                        {/* Исправили цвет пустой таблицы */}
                        <td colSpan={4} className="text-center py-4" style={{ color: 'var(--neon-cyan)', letterSpacing: '2px' }}>
                            [ СПРАВОЧНИК ПУСТ ]
                        </td>
                    </tr>
                )}
                </tbody>
            </Table>

            <Modal show={showModal} onHide={handleClose} contentClassName="bg-dark border-info">
                <Modal.Header closeButton closeVariant="white" className="border-bottom border-info">
                    <Modal.Title style={{ color: 'var(--neon-magenta)' }}>
                        {isEditing ? `РЕДАКТИРОВАТЬ: ${title}` : `ДОБАВИТЬ: ${title}`}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-light">
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label className="text-info">Название</Form.Label>
                            <Form.Control
                                className="form-control-cyber"
                                name="title"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label className="text-info">{secondFieldLabel}</Form.Label> {/* Динамический лейбл */}
                            <Form.Control
                                as="textarea"
                                rows={2}
                                className="form-control-cyber"
                                name="secondValue"
                                value={formData.secondValue}
                                onChange={e => setFormData({ ...formData, secondValue: e.target.value })}
                            />
                        </Form.Group>
                        <div className="d-flex gap-2 justify-content-end">
                            <button type="button" className="btn btn-outline-secondary" onClick={handleClose}>
                                ОТМЕНА
                            </button>
                            <button type="submit" className="btn btn-cyber">
                                {isEditing ? 'ОБНОВИТЬ' : 'СОХРАНИТЬ'}
                            </button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </motion.div>
    );
};