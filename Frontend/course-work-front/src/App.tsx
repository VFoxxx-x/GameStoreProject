import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import Library from './pages/Library';
import GameDetails from './pages/GameDetails';
import type {JSX} from "react";
// остальные страницы по мере создания: GameDetails, Cart, Library, Profile, Admin

// Защитный компонент для приватных путей
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated());
  return isAuthenticated ? children : <Navigate to="/auth" />;
};

function App() {
  return (
      <BrowserRouter>
        <Navbar />
        <div className="container mt-4">
          <Routes>
            {/* 1. Главная (Каталог) */}
            <Route path="/" element={<Home />} />
            {/* 2. Авторизация */}
            <Route path="/auth" element={<Auth />} />

            {/* 3. Детали игры (Открыто всем) */}
              <Route path="/game/:id" element={<GameDetails />} />

            {/* Защищенные маршруты */}
            {/* 4. Корзина */}
            <Route path="/cart" element={<ProtectedRoute><Cart/></ProtectedRoute>} />
            {/* 5. Библиотека */}
            <Route path="/library" element={<ProtectedRoute><Library/></ProtectedRoute>} />
            {/* 6. Профиль */}
            <Route path="/profile" element={<ProtectedRoute><Profile/></ProtectedRoute>} />
            {/* 7. Админка */}
            <Route path="/admin" element={<ProtectedRoute><Admin/></ProtectedRoute>} />
          </Routes>
        </div>
      </BrowserRouter>
  );
}

export default App;
