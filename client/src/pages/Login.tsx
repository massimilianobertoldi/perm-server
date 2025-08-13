import React, { useState } from 'react';
import { useAuth } from '../auth';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('student@dance.local');
  const [password, setPassword] = useState('student123');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      nav('/');
    } catch (e: any) {
      setError(e.message || 'Errore di login');
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '60px auto' }}>
      <h2>Login</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
        </div>
        <div>
          <label>Password</label>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Accedi</button>
      </form>
      <p>
        Non hai un account? <Link to="/register">Registrati</Link>
      </p>
    </div>
  );
}