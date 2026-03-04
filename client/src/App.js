import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Pos from './pages/Pos';
import Orders from './pages/Orders';
import AddStaff from './pages/AddStaff'
import ManageServices from './pages/ManageServices';
import Login from './pages/Login';
import Register from './pages/Register';
import Customers from './pages/Customers'; // 1. Import the component

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes (No Sidebar) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Private Routes (Wrapped in Sidebar Layout) */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pos" element={<Pos />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/customers" element={<Customers />} />
                    <Route path="/staff" element={<AddStaff />} />
          <Route path="/services" element={<ManageServices />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;