import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

function Home() {
  const { isAuthenticated, user, logout, fetchUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1>Welcome to the home page</h1>
      {isAuthenticated ? (
        <div>
          <p>Hi there {user?.username}!</p>
          <p>You are logged in.</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <p>
          You are not logged in. <Link to="/login">Login</Link>
        </p>
      )}
    </div>
  );
}

export default Home;