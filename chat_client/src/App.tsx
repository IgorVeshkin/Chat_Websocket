import {BrowserRouter, Routes, Route} from 'react-router-dom';

// Импорт страниц системы
import ChatroomPage from "./pages/ChatroomPage";
import LoginPage from "./pages/LoginPage";

import ProtectedRoute from './ProtectedRoute';

import "./App.css";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Страница чата */}
                <Route element={<ProtectedRoute />}>
                    <Route path="*" element={<ChatroomPage/>} />
                </Route>

                {/* Страница логина */}
                <Route path="login" element={<LoginPage/>} />

            </Routes>
        </BrowserRouter>
    );
}
