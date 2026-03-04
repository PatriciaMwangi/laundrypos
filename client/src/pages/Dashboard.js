import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const Dashboard = () => {
    // Initial state matching the exact keys from your JSON response
    const [stats, setStats] = useState({
        actual_cash_collected: 0,
        orders_due_today: 0,
        orders_made_today: 0,
        pending_laundry: 0,
        potential_revenue: 0,
        total_orders: 0
    });
    const [dueOrders, setDueOrders] = useState([]);
    const user = JSON.parse(localStorage.getItem('user'));

    const fetchDashboardData = async () => {
        try {
            const [statsRes, listRes] = await Promise.all([
                api.get(`/laundry/daily-summary/${user.business_id}`),
                api.get(`/laundry/orders-due-today/${user.business_id}`)
            ]);
            // statsRes.data contains the JSON seen in your network tab
            setStats(statsRes.data); 
            setDueOrders(listRes.data);
        } catch (err) {
            console.error("Error loading dashboard data", err);
        }
    };

    useEffect(() => {
        if (user?.business_id) fetchDashboardData();
    }, [user.business_id]);

    const handleMarkCollected = async (orderNumber) => {
        if (!window.confirm(`Mark Order ${orderNumber} as collected and fully paid?`)) return;
        try {
            await api.post(`/laundry/complete-order/${orderNumber}`);
            await fetchDashboardData(); // Re-fetch both stats and list
            alert("Order finalized!");
        } catch (err) {
            alert("Failed to update order status");
        }
    };

    return (
        <div style={pageContainer}>
            <h2 style={{ color: '#1e293b', marginBottom: '25px' }}>Manager's Daily Overview</h2>
            
            <div style={statsGrid}>
                {/* 1. Orders Due Today - Uses stats.orders_due_today from JSON */}
                <div style={statCard}>
                    <h3 style={labelStyle}>Orders Due Today</h3>
                    <p style={valueStyle}>{stats.orders_due_today}</p>
                </div>

                {/* 2. Cash Collected - Uses actual_cash_collected from JSON */}
                <div style={{ ...statCard, borderLeft: '4px solid #10b981' }}>
                    <h3 style={labelStyle}>Cash Collected Today</h3>
                    <p style={{ ...valueStyle, color: '#10b981' }}>KES {stats.actual_cash_collected}</p>
                </div>

                {/* 3. Sales Booked - Uses potential_revenue from JSON */}
                <div style={{ ...statCard, borderLeft: '4px solid #3b82f6' }}>
                    <h3 style={labelStyle}>Sales Booked</h3>
                    <p style={{ ...valueStyle, color: '#3b82f6' }}>KES {stats.potential_revenue}</p>
                </div>

                {/* 4. In-Wash - Uses pending_laundry from JSON */}
                <div style={{ ...statCard, borderLeft: '4px solid #f59e0b' }}>
                    <h3 style={labelStyle}>In-Wash</h3>
                    <p style={{ ...valueStyle, color: '#f59e0b' }}>{stats.pending_laundry}</p>
                </div>

                {/* 5. Booked Today - Uses orders_made_today from JSON */}
                <div style={{ ...statCard, borderLeft: '4px solid #ec4899' }}>
                    <h3 style={labelStyle}>Booked Today</h3>
                    <p style={{ ...valueStyle, color: '#ec4899' }}>{stats.orders_made_today}</p>
                </div>
            </div>

            <div style={tableContainer}>
                <h3 style={{ marginBottom: '20px' }}>🧺 Today's Pickups</h3>
                <table style={tableStyle}>
                    <thead>
                        <tr style={headerRowStyle}>
                            <th>Order #</th>
                            <th>Customer</th>
                            <th>Total</th>
                            <th>Balance</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dueOrders.length > 0 ? (
                            dueOrders.map((order) => (
                                <tr key={order.order_number} style={rowStyle}>
                                    <td style={cellStyle}>{order.order_number}</td>
                                    <td style={cellStyle}>{order.first_name} {order.last_name || ''}</td>
                                    <td style={cellStyle}>KES {order.total_amount}</td>
                                    <td style={{ ...cellStyle, color: '#ef4444', fontWeight: 'bold' }}>
                                        KES {order.total_amount - order.amount_paid}
                                    </td>
                                    <td style={cellStyle}>
                                        <button 
                                            onClick={() => handleMarkCollected(order.order_number)}
                                            style={actionButtonStyle}
                                        >
                                            Mark Collected
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                    No pickups scheduled for today.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Modern Dashboard Styling ---
const pageContainer = { padding: '30px', backgroundColor: '#f8fafc', minHeight: '100vh' };
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' };
const statCard = { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' };
const labelStyle = { fontSize: '14px', color: '#64748b', margin: '0 0 10px 0' };
const valueStyle = { fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#1e293b' };
const tableContainer = { marginTop: '40px', backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const headerRowStyle = { textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#475569', fontSize: '14px' };
const rowStyle = { borderBottom: '1px solid #f1f5f9' };
const cellStyle = { padding: '16px 0', fontSize: '14px', color: '#334155' };
const actionButtonStyle = { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' };

export default Dashboard;