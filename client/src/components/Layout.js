import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'New Order (POS)', path: '/pos', icon: '🛒' },
    { name: 'Order Board', path: '/orders', icon: '🧺' },
    { name: 'Services & Prices', path: '/services', icon: '💰' },
    { name: 'Customers', path: '/customers', icon: '👥' },
        { name: 'AddStaff', path: '/staff', icon: '👥' },

  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <nav style={sidebarStyle}>
        <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid #4B32A3' }}>
          <h3 style={{ margin: 0 }}>LaundryPOS</h3>
          <small>{user?.name} ({user?.role})</small>
        </div>

        <ul style={{ listStyle: 'none', padding: '10px 0', margin: 0, flex: 1 }}>
          {menuItems.map((item) => (
            <li 
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                ...navItemStyle,
                backgroundColor: location.pathname === item.path ? '#4B32A3' : 'transparent',
              }}
            >
              <span style={{ marginRight: '10px' }}>{item.icon}</span>
              {item.name}
            </li>
          ))}
        </ul>

        <div style={{ padding: '20px', borderTop: '1px solid #4B32A3' }}>
          <button onClick={handleLogout} style={logoutBtnStyle}>
            🚪 Logout
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1, backgroundColor: '#f4f7fe', padding: '20px', overflowY: 'auto' }}>
        <Outlet /> {/* This is where the specific page content renders */}
      </main>
    </div>
  );
};

const sidebarStyle = {
  width: '260px',
  backgroundColor: '#5D3FD3',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  position: 'sticky',
  top: 0,
  height: '100vh'
};

const navItemStyle = {
  padding: '15px 25px',
  cursor: 'pointer',
  transition: '0.2s',
  fontSize: '16px',
  display: 'flex',
  alignItems: 'center'
};

const logoutBtnStyle = {
  width: '100%',
  padding: '10px',
  backgroundColor: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.3)',
  color: '#fff',
  borderRadius: '4px',
  cursor: 'pointer'
};

export default Layout;