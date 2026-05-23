import { Navbar, Nav, Container, NavDropdown, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore'; // Путь к вашему чистому store

const CyberNavbar = () => {
    const navigate = useNavigate();

    // 1. Просто и элегантно достаем готовые данные из вашего store
    const { role, userName, logout, isAuthenticated } = useAuthStore();

    // В зависимости от того, как вы написали isAuthenticated (как функцию или как переменную)
    const isAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : isAuthenticated;

    // 2. Логика выхода
    const handleLogout = () => {
        logout();
        navigate('/'); // Возвращаем на главную страницу каталога
    };

    return (
        <Navbar expand="lg" className="navbar-cyber sticky-top">
            <Container>
                {/* ЛОГОТИП */}
                <Navbar.Brand as={Link} to="/">
                    GAME//STORE
                </Navbar.Brand>

                {/* Кнопка-гамбургер для мобильных устройств */}
                <Navbar.Toggle aria-controls="basic-navbar-nav" />

                <Navbar.Collapse id="basic-navbar-nav">

                    {/* ОСНОВНОЕ МЕНЮ СЛЕВА */}
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/">Каталог</Nav.Link>

                        {/* Показываем разделы клиента только авторизованным */}
                        {isAuth && (
                            <>
                                <Nav.Link as={Link} to="/library">Библиотека</Nav.Link>
                                <Nav.Link as={Link} to="/cart">Корзина</Nav.Link>
                            </>
                        )}

                        {/* Кнопка Админки - строго по роли */}
                        {role === 'Admin' && (
                            <Nav.Link as={Link} to="/admin" style={{ color: 'var(--neon-yellow)' }}>
                                [ROOT_АДМИН]
                            </Nav.Link>
                        )}
                    </Nav>

                    {/* МЕНЮ ПОЛЬЗОВАТЕЛЯ СПРАВА */}
                    <Nav>
                        {!isAuth ? (
                            // Если гость
                            <Link to="/auth" className="btn btn-cyber">
                                ВХОД / РЕГИСТРАЦИЯ
                            </Link>
                        ) : (
                            // Если авторизован - красивый Dropdown
                            <NavDropdown
                                // Убрали жесткий style, теперь цвет управляется через CSS .nav-link
                                title={`Деккер: ${userName || 'Агент'}`}
                                id="basic-nav-dropdown"
                                className="dropdown-menu-cyber"
                                menuVariant="dark"
                                align="end"
                            >
                                <NavDropdown.Item as={Link} to="/profile">
                                    Личный кабинет
                                    {role === 'Admin' && <Badge bg="danger" className="ms-2">ADMIN</Badge>}
                                </NavDropdown.Item>

                                <NavDropdown.Item as={Link} to="/cart">
                                    Моя корзина
                                </NavDropdown.Item>

                                <NavDropdown.Divider style={{ borderColor: 'var(--neon-cyan)' }} />

                                <NavDropdown.Item onClick={handleLogout} className="text-danger fw-bold">
                                    ОТКЛЮЧИТЬСЯ
                                </NavDropdown.Item>
                            </NavDropdown>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default CyberNavbar;