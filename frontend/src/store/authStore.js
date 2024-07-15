import { create } from 'zustand';
import { persist } from 'zustand/middleware';


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
      storage: () => localStorage,
    }
  )
);

export const getCSRFToken = () => {
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
