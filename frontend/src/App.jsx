import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import { useAuthStore } from './store/authStore';

function App() {
  const setCsrfToken = useAuthStore(state => state.setCsrfToken);

  useEffect(() => {
    void setCsrfToken();
  }, [setCsrfToken]);

  return (
    <div className="p-10 m-auto w-1/2 flex gap-2">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </div>
  );
}

export default App;