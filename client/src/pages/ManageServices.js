import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const ManageServices = () => {
    const [services, setServices] = useState([]);
    const [newService, setNewService] = useState({ name: '', price: '', category: 'Wash & Fold' });
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.role === 'Admin';
    
// Add this state at the top with your other states
const [searchTerm, setSearchTerm] = useState('');

// Logic to filter services based on the name or category
const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
);
    const fetchServices = async () => {
        try {
            const res = await api.get(`/laundry/products/${user.business_id}`);
            setServices(res.data);
        } catch (err) {
            console.error("Error fetching services:", err);
        }
    };

    useEffect(() => { fetchServices(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await api.post('/laundry/products', { ...newService, business_id: user.business_id });
        setNewService({ name: '', price: '', category: 'Wash & Fold' });
        fetchServices();
    };

    const handleDelete = async (productId) => {
        if (window.confirm("Are you sure you want to remove this service?")) {
            await api.delete(`/laundry/products/${productId}`);
            fetchServices();
        }
    };

    const handleUpdatePrice = async (service) => {
        const newPrice = window.prompt(`Update price for ${service.name}:`, service.price);
        if (newPrice && !isNaN(newPrice)) {
            await api.patch(`/laundry/products/${service.product_id}`, { price: parseFloat(newPrice) });
            fetchServices();
        }
    };

    return (
        <div style={pageLayout}>
            {/* Left Side: Add Service Form Card */}
            <div style={formCard}>
                <h3 style={cardTitle}>✨ New Service</h3>
                <form onSubmit={handleSubmit} style={formStyle}>
                    <div style={inputGroup}>
                        <label style={labelStyle}>Service Name</label>
                        <input 
                            style={inputStyle}
                            placeholder="e.g. Duvet (Large)" 
                            value={newService.name} 
                            onChange={e => setNewService({...newService, name: e.target.value})} 
                            required 
                        />
                    </div>
                    <div style={inputGroup}>
                        <label style={labelStyle}>Price (KES)</label>
                        <input 
                            type="number" 
                            style={inputStyle}
                            placeholder="500" 
                            value={newService.price} 
                            onChange={e => setNewService({...newService, price: e.target.value})} 
                            required 
                        />
                    </div>
                    <div style={inputGroup}>
                        <label style={labelStyle}>Category</label>
                        <select 
                            style={inputStyle}
                            value={newService.category}
                            onChange={e => setNewService({...newService, category: e.target.value})}
                        >
                            <option value="Wash & Fold">Wash & Fold</option>
                            <option value="Dry Cleaning">Dry Cleaning</option>
                            <option value="Ironing">Ironing</option>
                        </select>
                    </div>
                    <button type="submit" style={addBtnStyle}>Add Service</button>
                </form>
            </div>

          {/* Right Side: Services Table Card */}
<div style={tableCard}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#1e293b', fontSize: '18px' }}>📋 Active Price List</h3>
        
        {/* Search Input */}
        <div style={{ position: 'relative', width: '250px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
            <input 
                type="text" 
                placeholder="Search services..." 
                style={{ ...inputStyle, paddingLeft: '35px', width: '100%' }} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
    </div>

    <table style={tableStyle}>
        <thead>
            <tr style={thRowStyle}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Price</th>
                {isAdmin && <th style={thStyle}>Actions</th>}
            </tr>
        </thead>
        <tbody>
            {filteredServices.length > 0 ? (
                filteredServices.map(s => (
                    <tr key={s.product_id} style={trStyle}>
                        <td style={tdStyle}><strong>{s.name}</strong></td>
                        <td style={tdStyle}>
                            <span style={categoryBadge(s.category)}>{s.category}</span>
                        </td>
                        <td style={tdStyle}>KES {s.price}</td>
                        {isAdmin && (
                            <td style={tdStyle}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => handleUpdatePrice(s)} style={editBtnStyle}>✎</button>
                                    <button onClick={() => handleDelete(s.product_id)} style={deleteBtnStyle}>🗑</button>
                                </div>
                            </td>
                        )}
                    </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={isAdmin ? 4 : 3} style={{ ...tdStyle, textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No services found matching "{searchTerm}"
                    </td>
                </tr>
            )}
        </tbody>
    </table>
</div>
             
        </div>
    );
};

// --- Styles ---
const pageLayout = { display: 'flex', gap: '30px', padding: '30px', backgroundColor: '#f8fafc', minHeight: '100vh', flexWrap: 'wrap' };
const formCard = { flex: '1', minWidth: '300px', backgroundColor: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', height: 'fit-content' };
const tableCard = { flex: '2', minWidth: '500px', backgroundColor: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' };
const cardTitle = { margin: '0 0 20px 0', color: '#1e293b', fontSize: '18px' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '5px' };
const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#64748b' };
const inputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' };
const addBtnStyle = { padding: '12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' };

const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thRowStyle = { backgroundColor: '#f1f5f9' };
const thStyle = { padding: '12px', textAlign: 'left', fontSize: '13px', color: '#475569', borderBottom: '2px solid #e2e8f0' };
const tdStyle = { padding: '12px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#334155' };
const trStyle = { transition: 'background-color 0.2s' };

const editBtnStyle = { backgroundColor: '#f59e0b', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' };
const deleteBtnStyle = { backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' };

const categoryBadge = (cat) => {
    const colors = {
        'Wash & Fold': { bg: '#dbeafe', text: '#1e40af' },
        'Dry Cleaning': { bg: '#fef9c3', text: '#854d0e' },
        'Ironing': { bg: '#dcfce7', text: '#166534' }
    };
    const style = colors[cat] || { bg: '#f3f4f6', text: '#374151' };
    return { backgroundColor: style.bg, color: style.text, padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' };
};

export default ManageServices;