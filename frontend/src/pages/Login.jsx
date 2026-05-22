import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LogIn } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please fill in all fields', 'error');
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      addToast('Logged in successfully', 'success');
      navigate('/');
    } else {
      addToast(result.message, 'error');
    }
  };

  return (
    <div className="container" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ marginBottom: '8px', fontSize: '1.8rem', textAlign: 'center' }}>WELCOME BACK</h2>
        <p style={{ opacity: 0.6, fontSize: '0.9rem', textAlign: 'center', marginBottom: '24px' }}>Sign in to reserve your premium vehicle</p>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="e.g. user@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn" style={{ width: '100%', marginTop: '8px' }} disabled={submitting}>
            <LogIn size={16} />
            <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem' }}>
          <span style={{ opacity: 0.6 }}>New to the system? </span>
          <Link to="/register" style={{ fontWeight: 600, borderBottom: '1px solid var(--text-color)' }}>
            Create Account
          </Link>
        </div>

        <div style={{ marginTop: '20px', borderTop: '1px dashed var(--border-color)', paddingTop: '16px', fontSize: '0.8rem', opacity: 0.5, textAlign: 'center' }}>
          <p>Demo Admin: admin@gmail.com / admin123</p>
          <p>Demo User: user@gmail.com / user123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
