import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

function Home() {
  const { isAuthenticated, user, logout, fetchUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    void fetchUser();
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
    <div className="2">
      <h1>Welcome to the home page</h1>
      {isAuthenticated ? (
        <div>
          <p>Hi there {user?.username}!</p>
          <p>You are logged in.</p>
          <p>{user?.secret_fact}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <p className="flex flex-col">
          You are not logged in.
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </p>
      )}
    </div>
  );
}

export default Home;