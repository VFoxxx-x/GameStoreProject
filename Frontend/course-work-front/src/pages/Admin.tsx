import { useState, useEffect } from 'react';
import {Container, Row, Col, Nav} from 'react-bootstrap';
import { AnimatePresence } from 'framer-motion';

import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { AdminUsers } from '../components/AdminUsers';
import { AdminGames } from '../components/AdminGames.tsx'
import { AdminDictionary } from '../components/AdminDictionary';
import { AdminSendNotification} from '../components/AdminSendNotification';
import { AdminOrders } from '../components/AdminOrders';


const Admin = () => {
    const role = useAuthStore(state => state.role);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users');

    // Безопасность фронтенда: если не админ, выкидываем отсюда
    useEffect(() => {
        if (role !== 'Admin') {
            navigate('/');
        }
    }, [role, navigate]);

    if (role !== 'Admin') return null; // Предотвращаем мерцание

    return (
        <Container fluid className="mt-4">
            <h2 className="mb-4 text-uppercase" style={{ color: 'var(--neon-magenta)' }}>
                Терминал Администратора // ROOT_ACCESS
            </h2>
            <Row>
                {/* ЛЕВОЕ БОКОВОЕ МЕНЮ */}
                <Col md={2}>
                    <Nav className="flex-column nav-cyber">
                        <Nav.Link
                            active={activeTab === 'users'}
                            onClick={() => setActiveTab('users')}>
                            Пользователи
                        </Nav.Link>
                        <Nav.Link
                            active={activeTab === 'notifications'}
                            onClick={() => setActiveTab('notifications')}>
                            Оповещения
                        </Nav.Link>
                        <Nav.Link
                            active={activeTab === 'games' }
                            onClick={() => setActiveTab('games')}>
                            Каталог игр
                        </Nav.Link>
                        <Nav.Link
                            active={activeTab === 'orders'}
                            onClick={() => setActiveTab('orders')}>
                            Заказы
                        </Nav.Link>
                        <Nav.Link
                            active={activeTab === 'roles'}
                            onClick={() => setActiveTab('roles')}>
                            Управление ролями
                        </Nav.Link>
                        <hr style={{ borderColor: 'var(--neon-cyan)', margin: '10px 0' }} />
                        <div className="small ps-3 mb-2 mt-3 fw-bold" style={{ color: 'var(--neon-yellow)', letterSpacing: '2px' }}>
                            СПРАВОЧНИКИ
                        </div>

                        <Nav.Link active={activeTab === 'genres'} onClick={() => setActiveTab('genres')}>
                            Жанры
                        </Nav.Link>
                        <Nav.Link active={activeTab === 'platforms'} onClick={() => setActiveTab('platforms')}>
                            Платформы
                        </Nav.Link>
                        <Nav.Link active={activeTab === 'developers'} onClick={() => setActiveTab('developers')}>
                            Разработчики
                        </Nav.Link>
                        <Nav.Link active={activeTab === 'publishers'} onClick={() => setActiveTab('publishers')}>
                            Издатели
                        </Nav.Link>
                    </Nav>
                </Col>

                {/* ПРАВАЯ РАБОЧАЯ ЗОНА */}
                <Col md={10}>
                    <div className="card p-4" style={{ minHeight: '60vh' }}>
                        <AnimatePresence mode="wait">
                            {activeTab === 'users' && <AdminUsers key="users" />}
                            {activeTab === 'games' && <AdminGames key="games" />}
                            {activeTab === 'notifications' && <AdminSendNotification key="notifications" />}
                            {activeTab === 'orders' && <AdminOrders key="orders" />}
                            {activeTab === 'roles' && <div key="roles">Управление ролями (В разработке...)</div>}
                            {activeTab === 'genres' && (
                                <AdminDictionary key="genres" title="Жанры" endpoint="/Genres" />
                            )}
                            {activeTab === 'platforms' && (
                                <AdminDictionary
                                    key="platforms"
                                    title="Платформы"
                                    endpoint="/Platform"
                                    secondFieldKey="type"      /* Указываем, что в БД поле называется type */
                                    secondFieldLabel="Тип"     /* Указываем, что на экране писать "Тип" */
                                />
                            )}
                            {activeTab === 'developers' && (
                                <AdminDictionary key="developers" title="Разработчики" endpoint="/Developer" />
                            )}
                            {activeTab === 'publishers' && (
                                <AdminDictionary key="publishers" title="Издатели" endpoint="/Publishers" />
                            )}
                        </AnimatePresence>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};





export default Admin;