'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';
import { useRouter } from 'next/navigation';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('tf_token');
    if (token) {
      api.me()
        .then(({ user }) => setUser(user))
        .catch((err) => {
          // Ne supprimer le token que si c'est une erreur d'authentification (401)
          if (err.message.includes('401') || err.message.includes('token') || err.message.includes('expired')) {
            localStorage.removeItem('tf_token');
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    const { token, user } = await api.login({ email, password });
    localStorage.setItem('tf_token', token);
    setUser(user);
    return user;
  }

  async function register(email, password, name, role) {
    const { token, user } = await api.register({ email, password, name, role });
    localStorage.setItem('tf_token', token);
    setUser(user);
    return user;
  }

  function logout() {
    localStorage.removeItem('tf_token');
    setUser(null);
    router.push('/auth/login');
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);