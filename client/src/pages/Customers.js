import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomerOrders, setSelectedCustomerOrders] = useState(null);
    const [activeCustomerId, setActiveCustomerId] = useState(null);
    const [loading,setLoading] = useState([])
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchCustomers();
    }, []);

const fetchCustomers = async () => {
    try {
        // Get the user object from LocalStorage (seen in your screenshot)
        const userData = JSON.parse(localStorage.getItem('user'));
        
        const res = await api.get('/laundry/customers-summary', {
            headers: {
                'X-Business-Id': userData.business_id
            }
        });
        setCustomers(res.data);
    } catch (err) {
        console.error("Fetch error:", err);
    }
};

    const handleCustomerClick = async (customerId) => {
        if (activeCustomerId === customerId) {
            setActiveCustomerId(null); // Toggle off
            return;
        }
        const res = await api.get(`/laundry/customer-orders/${customerId}`);
        setSelectedCustomerOrders(res.data);
        setActiveCustomerId(customerId);
    };

    const filteredCustomers = customers.filter(c => 
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone_number.includes(searchTerm)
    );

    return (
        <div style={{ padding: '30px', backgroundColor: '#f8fafc' }}>
            <h2>👥 Customer Loyalty Directory</h2>
            
            <input 
                type="text" 
                placeholder="Search by name or phone..." 
                style={searchStyle} 
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div style={tableContainerStyle}>
                <table style={tableStyle}>
                    <thead>
                        <tr style={thRowStyle}>
                            <th style={tdStyle}>Customer Name</th>
                            <th style={tdStyle}>Phone</th>
                            <th style={tdStyle}>Address</th>
                            <th style={tdStyle}>Total Services</th>
                            <th style={tdStyle}>Last Visit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map(customer => (
                            <React.Fragment key={customer.customer_id}>
                                <tr 
                                    onClick={() => handleCustomerClick(customer.customer_id)}
                                    style={{ cursor: 'pointer', backgroundColor: activeCustomerId === customer.customer_id ? '#f1f5f9' : 'transparent' }}
                                >
                                    <td style={{ ...tdStyle, color: '#3b82f6', fontWeight: 'bold' }}>
                                        {customer.first_name} {customer.last_name}
                                    </td>
                                    <td style={tdStyle}>{customer.phone_number}</td>
                                    <td style={tdStyle}>{customer.physical_address || 'N/A'}</td>
                                    <td style={tdStyle}>
                                        <span style={countBadge}>{customer.total_services} Orders</span>
                                    </td>
                                    <td style={tdStyle}>{new Date(customer.last_visit).toLocaleDateString()}</td>
                                </tr>

                                {/* Sub-table for Order History */}
                                {activeCustomerId === customer.customer_id && (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '0px', backgroundColor: '#f8fafc' }}>
                                            <div style={historyPanel}>
                                                <h4>📜 Order History for {customer.first_name}</h4>
                                                <table style={{ width: '100%', fontSize: '12px' }}>
                                                    <thead>
                                                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                                            <th>Order #</th>
                                                            <th>Date</th>
                                                            <th>Amount</th>
                                                            <th>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedCustomerOrders?.map(order => (
                                                            <tr key={order.order_number}>
                                                                <td>{order.order_number}</td>
                                                                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                                                <td>KES {order.total_amount}</td>
                                                                <td>{order.order_status}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Styles ---
const searchStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px' };
const tableContainerStyle = { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thRowStyle = { backgroundColor: '#f1f5f9', textAlign: 'left' };
const tdStyle = { padding: '15px', borderBottom: '1px solid #eee' };
const countBadge = { backgroundColor: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' };
const historyPanel = { padding: '20px', margin: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fff' };

export default Customers;