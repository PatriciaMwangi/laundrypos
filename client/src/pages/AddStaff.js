import React, { useState } from 'react';
import api from '../api/axios';

const AddStaff = () => {
  const [staffData, setStaffData] = useState({
    full_name: '',
    phone_number: '',
    username: '',
    password: ''
  });

  const handleAddStaff = async (e) => {
    e.preventDefault();
    
    const loggedInUser = JSON.parse(localStorage.getItem('user')); 
    const payload = { ...staffData, business_id: loggedInUser.business_id };

    try {
      await api.post('/auth/add-staff', payload);
      alert("Staff member added successfully!");
      setStaffData({ full_name: '', phone_number: '', username: '', password: '' }); // Clear form
    } catch (err) {
      alert(err.response?.data?.error || "Error adding staff");
    }
  };

  return (
    <div style={pageContainer}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={iconCircle}>👤</div>
          <h3 style={{ margin: '10px 0 5px 0', color: '#1e293b' }}>Add New Attendant</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Register a new staff member for your branch
          </p>
        </div>

        <form onSubmit={handleAddStaff} style={formStyle}>
          <div style={inputGroup}>
            <label style={labelStyle}>Full Name</label>
            <input 
              type="text" 
              placeholder="e.g. John Doe" 
              style={inputStyle}
              value={staffData.full_name}
              onChange={e => setStaffData({...staffData, full_name: e.target.value})} 
              required 
            />
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>Phone Number</label>
            <input 
              type="text" 
              placeholder="e.g. +254" 
              style={inputStyle}
              value={staffData.phone_number}
              onChange={e => setStaffData({...staffData, phone_number: e.target.value})} 
              required 
            />
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>Username</label>
            <input 
              type="text" 
              placeholder="attendant_user" 
              style={inputStyle}
              value={staffData.username}
              onChange={e => setStaffData({...staffData, username: e.target.value})} 
              required 
            />
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              style={inputStyle}
              value={staffData.password}
              onChange={e => setStaffData({...staffData, password: e.target.value})} 
              required 
            />
          </div>

          <button type="submit" style={submitBtnStyle}>
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Styles ---
const pageContainer = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '40px 20px',
  backgroundColor: '#f8fafc',
  minHeight: '80vh'
};

const cardStyle = {
  backgroundColor: '#ffffff',
  padding: '40px',
  borderRadius: '16px',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  width: '100%',
  maxWidth: '400px',
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '30px'
};

const iconCircle = {
  width: '60px',
  height: '60px',
  backgroundColor: '#eff6ff',
  borderRadius: '50%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '24px',
  margin: '0 auto'
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
};

const inputGroup = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const labelStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#475569'
};

const inputStyle = {
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
  '&:focus': { borderColor: '#3b82f6' }
};

const submitBtnStyle = {
  marginTop: '10px',
  padding: '12px',
  backgroundColor: '#3b82f6',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'background-color 0.2s'
};

export default AddStaff;