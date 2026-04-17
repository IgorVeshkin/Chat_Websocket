import {BrowserRouter, Routes, Route} from 'react-router-dom';

// Импорт страниц системы
import ChatroomPage from "./pages/ChatroomPage";
import LoginPage from "./pages/LoginPage";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Страница чата */}
                <Route path="*" element={<ChatroomPage/>} />

                {/* Страница логина */}
                <Route path="login" element={<LoginPage/>} />

            </Routes>
        </BrowserRouter>
    );
}
