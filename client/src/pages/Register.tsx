import React, { useState } from 'react';
import { api } from '../api';
import { Link, useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const nav = useNavigate();
  const [name, setName] = useState('Nuovo Studente');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.register(name, email, password);
      nav('/login');
    } catch (e: any) {
      setError(e.message || 'Errore di registrazione');
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '60px auto' }}>
      <h2>Registrazione</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label>Nome</label>
          <input value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
        </div>
        <div>
          <label>Password</label>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Crea account</button>
      </form>
      <p>
        Hai già un account? <Link to="/login">Accedi</Link>
      </p>
    </div>
  );
}