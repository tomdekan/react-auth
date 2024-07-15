This tutorial will guide you through creating a full-stack application using Django Ninja for the backend API and React for the frontend, with a focus on implementing user authentication. 
We'll build the project step-by-step. Let's go 🏎

## Part 1: Setting Up the Backend (Django Ninja)

### 1.1 Create a new Django project

First, let's create a new Django project and app:

```bash
django-admin startproject core .
python manage.py startapp sim
```

### 1.2 Update Django settings

Open `core/settings.py` and make the following changes:

```python
INSTALLED_APPS = [
    # ...
    'sim',
    'ninja',
    'corsheaders',
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # Add this line
    # ... other middleware
]

# Add these settings at the end of the file
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]  # React app URL
CSRF_TRUSTED_ORIGINS = ['http://localhost:5173']

AUTH_USER_MODEL = 'sim.CustomUser'
```

### 1.3 Create a custom user model

In `sim/models.py`, add the following:

```python
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email
```

### 1.4 Set up URL routing

In `core/urls.py`, add:

```python
from django.contrib import admin
from django.urls import path
from sim.api import api

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/", api.urls),
]
```

### 1.5 Create API endpoints

Create `sim/api.py` and add:

```python
from ninja import NinjaAPI
from ninja.security import django_auth
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from .models import CustomUser as User
from . import schemas


api = NinjaAPI(csrf=True)


@api.get("/set-csrf-token")
def get_csrf_token(request):
    return {"csrftoken": get_token(request)}


@api.post("/login")
def login_view(request, payload: schemas.SignInSchema):
    user = authenticate(request, username=payload.email, password=payload.password)
    if user is not None:
        login(request, user)
        return {"success": True}
    return {"success": False, "message": "Invalid credentials"}


@api.post("/logout", auth=django_auth)
def logout_view(request):
    logout(request)
    return {"message": "Logged out"}


@api.get("/user", auth=django_auth)
def user(request):
    secret_fact = (
        "The moment one gives close attention to any thing, even a blade of grass",
        "it becomes a mysterious, awesome, indescribably magnificent world in itself."
    )
    return {
        "username": request.user.username,
        "email": request.user.email,
        "secret_fact": secret_fact
    }


@api.post("/register")
def register(request, payload: schemas.SignInSchema):
    try:
        User.objects.create_user(username=payload.email, email=payload.email, password=payload.password)
        return {"success": "User registered successfully"}
    except Exception as e:
        return {"error": str(e)}

```

### 1.6 Create schemas

Create `sim/schemas.py` and add:

```python
from ninja import ModelSchema
from .models import CustomUser
from pydantic import BaseModel


class UserSchema(ModelSchema):
    class Config:
        model = CustomUser
        model_fields = ['id', 'username', 'email']

        
class SignInSchema(BaseModel):
    email: str
    password: str
```

### 1.7 Apply migrations and test the backend

Run the following commands:

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

Visit `http://localhost:8000/api/docs` to see the API documentation. Test each endpoint using the interactive documentation to ensure they're working correctly.

## Part 2: Setting Up the Frontend (React)

### 2.1 Create a new React project

In a new terminal, navigate to your project root and run:

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm i zustand react-router-dom axios
```

### 2.2 Set up routing and main component

Replace the content of `src/App.jsx` with:

```jsx
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
```

### 2.3 Create authentication store

Create `src/store/authStore.js` and add:

```javascript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      setCsrfToken: async () => {
        const response = await fetch('http://localhost:8000/api/set-csrf-token', {
          method: 'GET',
          credentials: 'include'
        });
        const data = await response.json();
        return data.csrftoken;
      },

      login: async (email, password) => {
        const csrftoken = await get().setCsrfToken();
        const response = await fetch('http://localhost:8000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
          },
          body: JSON.stringify({ email, password }),
          credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
          set({ isAuthenticated: true });
          get().fetchUser();
        } else {
          set({ user: null, isAuthenticated: false });
        }
        return data.success;
      },

      logout: async () => {
        try {
          const csrftoken = await get().setCsrfToken();
          const response = await fetch('http://localhost:8000/api/logout', {
            method: 'POST',
            headers: {
              'X-CSRFToken': csrftoken
            },
            credentials: 'include'
          });
          if (response.ok) {
            set({ user: null, isAuthenticated: false });
          }
        } catch (error) {
          console.error('Logout failed', error);
          throw error;
        }
      },

      fetchUser: async () => {
        try {
          const csrftoken = await get().setCsrfToken();
          const response = await fetch('http://localhost:8000/api/user', {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrftoken
            },
          });
          if (response.ok) {
            const data = await response.json();
            set({ user: data, isAuthenticated: true });
          } else {
            set({ user: null, isAuthenticated: false });
          }
        } catch (error) {
          console.error('Failed to fetch user', error);
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const getCSRFToken = () => {
  /*
  We get the csrftoken from the cookeis in the user's browser.
  You can use an package here if you want nicer code, or just use the code below.
  */
  const name = 'csrftoken';
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  if (cookieValue === null) {
    throw new Error('Missing CSRF cookie.');
  }
  return cookieValue;
};
```

### 2.4 Create React components

Create the following files in the `src/pages` directory:

- Create your home page at `src/pages/Home.jsx`:

```jsx
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
```


- Create your login page `src/pages/Login.jsx`:

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const success = await login(email, password);
    if (success) {
      navigate('/');
    } else {
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="login flex flex-col gap-5">
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default Login;
```

- Create your register page at `src/pages/Register.jsx`:

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCSRFToken } from '../store/authStore';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Registration successful! Please log in.');
        setTimeout(() => {
          navigate('/login');
        }, 1000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred during registration: ' + err);
    }
  };

  return (
    <div>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>
      {error && <p>{error}</p>}
      {success && <p>{success}</p>}
    </div>
  );
}

export default Register;
```

### 2.5 Update main.jsx

We want to use the React router to navigate between our different React components, which represent pages.
- So, replace the content of `src/main.jsx` with:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
```

### 2.6 Add Tailwind CSS (Optional)

To add [Tailwind CSS for styling](https://tailwindcss.com/docs/guides/vite){:target="_blank"}:

1. Install Tailwind and its dependencies:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

2. Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

3. Replace the content of `src/index.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Part 3: Testing and Verification

Now that we have set up both the backend and frontend, let's check ensure everything is working correctly.

### 3.1 Backend Testing

1. Start your Django server:

```bash
python manage.py runserver
```

2. Visit `http://localhost:8000/api/docs` to see the Django Ninja API documentation.

3. Test each endpoint using the interactive documentation:
   - Try to register a new user
   - Attempt to login with the created user
   - Fetch the user information
   - Test the logout functionality

If all these operations work without errors, your backend is set up correctly.

### 3.2 Frontend Testing

1. Start your React development server:

```bash
cd frontend
npm run dev
```

2. Visit `http://localhost:5173` (or the URL provided in the console).

3. Test the following user flows:
  
### 3.3 Cross-Origin Resource Sharing (CORS) Testing

1. Ensure both your Django and React servers are running.
2. In the React app, try to register, login, and fetch user data.
3. Open the browser's developer tools and check the Console and Network tabs for any CORS-related errors.

If you encounter CORS issues, double-check your Django settings to ensure the CORS middleware and settings are correctly configured.

## Congrats 🎉

You've set up a full-stack application with Django Ninja as the backend API and React as the frontend, implementing user authentication. This setup provides a solid foundation for building more complex applications.

## Next Steps

Here are some ideas of next things to build.

1. Implement password reset functionality
2. Add email verification for new user registrations
3. Create a user profile page where users can update their information

