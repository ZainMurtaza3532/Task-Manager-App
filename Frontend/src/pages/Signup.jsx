import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2 } from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setIsSubmitting(true);
    const success = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password
    });
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
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>Create an Account</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Sign up to start managing your tasks</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              className="form-input" 
              placeholder="Enter your name" 
              required 
            />
          </div>

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
              placeholder="Create a password" 
              required 
              minLength="6"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Confirm Password</label>
            <input 
              type="password" 
              name="confirmPassword" 
              value={formData.confirmPassword} 
              onChange={handleChange} 
              className="form-input" 
              placeholder="Confirm your password" 
              required 
              minLength="6"
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
            {isSubmitting ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
