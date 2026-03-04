import React, { useState } from 'react';
import api from '../api/axios'; // Importing our configured axios instance
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    
    try {
      const response = await api.post('/auth/login', formData);
      
      // CRITICAL: Save the 'user' object so the Dashboard can find 'business_id'
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Also save token if you're using it for middleware
      localStorage.setItem('token', response.data.token);
      
      navigate('/');
    } catch (err) {
      // Check if server sent a specific error message
      const msg = err.response?.data?.error || 'Login failed';
      setError(msg);
    }
};
 return (
    <div className="login-bg" style={{ backgroundColor: '#5D3FD3', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="login-card" style={{ backgroundColor: '#fff', width: '100%', maxWidth: '400px', borderRadius: '8px', padding: '40px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ color: '#333', margin: '0' }}>LaundryPOS</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>Sign in to manage your business</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Username</label>
            <input 
              type="text" 
              placeholder="Enter your username" 
              style={inputStyle}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required 
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              style={inputStyle}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required 
            />
          </div>

          <button type="submit" style={btnStyle}>
            Sign In
          </button>
        </form>

        <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '14px' }}>
          <span style={{ color: '#666' }}>Don't have an account? </span>
          <button 
            onClick={() => navigate('/register')} 
            style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontWeight: 'bold', padding: '0' }}
          >
            Register Business
          </button>
        </div>
      </div>
    </div>
  );
  
};
const inputStyle = {
  width: '100%',
  padding: '12px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  boxSizing: 'border-box',
  fontSize: '16px'
};

const btnStyle = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#007bff',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: 'bold',
  transition: 'background-color 0.2s'}
export default Login;