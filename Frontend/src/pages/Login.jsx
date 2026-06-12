import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, LayoutDashboard } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await login(formData);
    setIsSubmitting(false);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px 30px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--accent)', marginBottom: '16px' }}>
            <CheckCircle2 size={32} />
            <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>TaskFlow Pro</h1>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>Welcome back</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Log in to manage your tasks</p>
        </div>

        <form onSubmit={handleSubmit} className="form-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              className="form-input" 
              placeholder="Enter your email" 
              required 
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              className="form-input" 
              placeholder="Enter your password" 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ 
              width: '100%', padding: '12px', background: 'var(--accent)', color: 'white', 
              borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer',
              opacity: isSubmitting ? 0.7 : 1, marginTop: '10px'
            }}
          >
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/signup" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
