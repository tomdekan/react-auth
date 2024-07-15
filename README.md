# Complete Django Ninja + React Authentication Code Changes

```bash
python manage.py startapp sim
```

## Part 1. Create your backend (Django Ninja)


### Update your Django settings

Add or modify these settings in `core/settings.py`

```python
INSTALLED_APPS = [
    # ...
    'sim',
    'ninja',
    'corsheaders',
]
```

- Add your middleware for cors.
```python
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # Make sure this is above common middleware. The order is important here.
    # ... other middleware
]
```

- Add your CORS settings and our custom user model anywhere in settings.py
```python

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]  # React app URL
CSRF_TRUSTED_ORIGINS = ['http://localhost:5173']

AUTH_USER_MODEL = 'sim.CustomUser'
```


### Add a Django custom user

In keeping with [good practice](https://learndjango.com/tutorials/django-custom-user-model){:target="_blank"}, we'll create a custom Django user from the start.
Paste the below into your `sim/models.py`:


```python
# sim/models.py

from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email
```

### Add your backend's routes

- Add to `core/urls.py`:
```python
from django.contrib import admin
from django.urls import path
from sim.api import api

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/", api.urls),
]

```

### Create a file for your API
- Create a file at `sim/api.py` and add the below:

```python
[]
```

### sim/schemas.py (New file)

```python
[]
```

### Check the functionality.
- Run migrations to create your database:
```bash
python manage.py makemigrations
python manage.py migrate
```

- Run your server and check Django Ninja's routes (with lovely auto-documentation):
```bash
python manage.py runserver
```
- Visit `localhost:8000/api/docs` (Change the port if you're using a different port)


You should see:
[]


## Part 2. Create your frontend (React)

### Set up the React frontend
- In a new terminal, run the following commands in the root directory of your project:

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm i zustand react-router-dom 
```

- Check that your React app runs as expected by running the below and visiting the url:
```bash
npm run dev
```

We'll create a Zustand store to manage user authentication state and API calls.

We'll also save the user state to local storage for persistence. This will allow users to remain logged in even after refreshing the page.

### 
- Create a folder called `store`
- Create a new file called `authStore.js` in `store` with the following:

```javascript
// In src/store/authStore.js

[]
```

### 
src/pages/Register.jsx

Update the `handleSubmit` function:

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const csrftoken = await setCsrfToken();
    const response = await fetch('http://localhost:8000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      },
      body: JSON.stringify({ email, password, username: email }), // Using email as username
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
```



## Bonus: Add Tailwind

https://tailwindcss.com/docs/guides/vite
