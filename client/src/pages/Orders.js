import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [markAsCollected, setMarkAsCollected] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get(`/laundry/orders/${user.business_id}`);
      setOrders(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'All' || order.order_status === statusFilter;
    const matchesDate = !dateFilter || order.collection_date === dateFilter;
    const searchTerm = customerSearch.toLowerCase();
    const matchesCustomer =
      order.first_name.toLowerCase().includes(searchTerm) ||
      order.last_name.toLowerCase().includes(searchTerm) ||
      order.phone_number.includes(searchTerm) ||
      order.order_number.toLowerCase().includes(searchTerm);
    return matchesStatus && matchesDate && matchesCustomer;
  });

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const currentOrders = filteredOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

  useEffect(() => { setCurrentPage(1); }, [customerSearch, statusFilter, dateFilter]);

  const openPaymentModal = (order) => {
    setSelectedOrder(order);
    setPaymentAmount('');
    setMarkAsCollected(false);
  };

  // ✅ FIX: Open a dedicated print window instead of window.print()
  const printPaymentReceipt = (receipt) => {
    const printWindow = window.open('', '_blank', 'width=400,height=500');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: 80mm auto; margin: 5mm; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 13px;
            width: 80mm;
            margin: 0 auto;
            padding: 10px;
          }
          h2 { text-align: center; font-size: 15px; margin-bottom: 10px; letter-spacing: 1px; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          p { margin: 3px 0; }
          .bold { font-weight: bold; }
          .balance { color: ${receipt.balance > 0 ? 'red' : 'black'}; }
          .footer { text-align: center; margin-top: 12px; font-size: 11px; }
        </style>
      </head>
      <body>
        <h2>PAYMENT RECEIPT</h2>
        <div class="divider"></div>
        <p><span class="bold">Order:</span> ${receipt.order_number}</p>
        <p><span class="bold">Customer:</span> ${receipt.customer}</p>
        <p><span class="bold">Date:</span> ${receipt.date}</p>
        <div class="divider"></div>
        <p><span class="bold">PAID NOW:</span> KES ${receipt.amount}</p>
        <p><span class="bold">TOTAL PAID:</span> KES ${receipt.total_paid}</p>
        <p class="bold balance">BALANCE: KES ${receipt.balance}</p>
        <div class="divider"></div>
        <div class="footer">*** Thank you! ***</div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  const submitPayment = async () => {
    if (!paymentAmount || isNaN(paymentAmount)) {
      alert("Please enter a valid amount");
      return;
    }

    const additional = parseFloat(paymentAmount);
    const currentPaid = parseFloat(selectedOrder.amount_paid);
    const newTotalPaid = currentPaid + additional;

    if (newTotalPaid > selectedOrder.total_amount) {
      alert("Amount exceeds the total balance!");
      return;
    }

    try {
      await api.patch(`/laundry/update-payment/${selectedOrder.order_id}`, { amount_paid: newTotalPaid });

      const receipt = {
        order_number: selectedOrder.order_number,
        customer: `${selectedOrder.first_name} ${selectedOrder.last_name}`,
        amount: additional,
        total_paid: newTotalPaid,
        balance: selectedOrder.total_amount - newTotalPaid,
        date: new Date().toLocaleString()
      };

      setSelectedOrder(null);
      fetchOrders();

      // ✅ Print only the receipt, not the whole page
      printPaymentReceipt(receipt);

    } catch (err) {
      alert("Payment failed");
    }
  };

  const updateStatus = async (orderId, nextStatus) => {
    try {
      await api.patch(`/laundry/update-status/${orderId}`, { status: nextStatus });
      fetchOrders();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const getStatusBadge = (status) => {
    const base = { padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' };
    switch (status) {
      case 'Received':    return { ...base, backgroundColor: '#FEF9C3', color: '#854D0E' };
      case 'In Progress': return { ...base, backgroundColor: '#DBEAFE', color: '#1E40AF' };
      case 'Ready':       return { ...base, backgroundColor: '#DCFCE7', color: '#166534' };
      case 'Collected':   return { ...base, backgroundColor: '#F3F4F6', color: '#374151' };
      default: return base;
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading Order Board...</div>;

  return (
    <div style={{ padding: '30px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#1e293b' }}>📦 Laundry Order Management</h2>
        <button onClick={fetchOrders} style={refreshBtnStyle}>Refresh List</button>
      </div>

      {/* Filter Bar */}
      <div style={filterBarContainer}>
        <div style={{ flex: 2 }}>
          <input type="text" placeholder="Search Name, Phone, or Order #..." style={filterInput} value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <select style={filterInput} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Received">Received</option>
            <option value="In Progress">In Progress</option>
            <option value="Ready">Ready</option>
            <option value="Collected">Collected</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <input type="date" style={filterInput} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
        <button onClick={() => { setStatusFilter('All'); setDateFilter(''); setCustomerSearch(''); }} style={clearBtnStyle}>Clear</button>
      </div>

      {/* Orders Table */}
      <div style={{ ...tableContainerStyle, overflowX: 'auto' }}>
        <table style={{ ...tableStyle, minWidth: '1000px' }}>
          <thead>
            <tr style={headerRowStyle}>
              <th style={thStyle}>Order #</th>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Address</th>
              <th style={thStyle}>Total</th>
              <th style={thStyle}>Paid</th>
              <th style={thStyle}>Balance</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Due Date</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.length > 0 ? currentOrders.map((order) => (
              <tr key={order.order_id} style={rowStyle}>
                <td style={tdStyle}><strong>{order.order_number}</strong></td>
                <td style={tdStyle}>{order.first_name} {order.last_name}<br /><small>{order.phone_number}</small></td>
                <td style={tdStyle}>{order.physical_address || 'Pick-up'}</td>
                <td style={tdStyle}>KES {order.total_amount}</td>
                <td style={tdStyle}>KES {order.amount_paid}</td>
                <td style={{ ...tdStyle, color: (order.total_amount - order.amount_paid) > 0 ? '#e11d48' : '#166534', fontWeight: 'bold' }}>
                  KES {order.total_amount - order.amount_paid}
                </td>
                <td style={tdStyle}><span style={getStatusBadge(order.order_status)}>{order.order_status}</span></td>
                <td style={tdStyle}>{new Date(order.collection_date).toLocaleDateString()}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {order.order_status === 'Received'    && <button style={actionBtnStyle} onClick={() => updateStatus(order.order_id, 'In Progress')}>Wash</button>}
                    {order.order_status === 'In Progress' && <button style={actionBtnStyle} onClick={() => updateStatus(order.order_id, 'Ready')}>Ready</button>}
                    {order.order_status === 'Ready'       && <button style={actionBtnStyle} onClick={() => updateStatus(order.order_id, 'Collected')}>Finish</button>}
                    {order.order_status !== 'Collected' && order.amount_paid < order.total_amount && (
                      <button style={{ ...actionBtnStyle, backgroundColor: '#10b981' }} onClick={() => openPaymentModal(order)}>
                        💰 Pay
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={paginationContainer}>
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={pageBtnStyle}>Prev</button>
        <span>Page {currentPage} of {totalPages || 1}</span>
        <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} style={pageBtnStyle}>Next</button>
      </div>

      {/* Payment Modal */}
      {selectedOrder && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ marginTop: 0 }}>Finalize Order</h3>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              Order: <strong>{selectedOrder.order_number}</strong><br />
              Balance: <strong style={{ color: '#e11d48' }}>KES {selectedOrder.total_amount - selectedOrder.amount_paid}</strong>
            </p>

            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="finalizeOrder"
                  checked={markAsCollected}
                  onChange={(e) => {
                    setMarkAsCollected(e.target.checked);
                    if (e.target.checked) setPaymentAmount(selectedOrder.total_amount - selectedOrder.amount_paid);
                  }}
                  style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                />
                <label htmlFor="finalizeOrder" style={{ fontSize: '13px', cursor: 'pointer', fontWeight: 'bold', color: '#166534' }}>
                  Mark as Collected & Fully Paid
                </label>
              </div>
            </div>

            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>Amount to Pay (KES)</label>
            <input
              type="number"
              style={filterInput}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              disabled={markAsCollected}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={submitPayment} style={{ ...actionBtnStyle, backgroundColor: markAsCollected ? '#059669' : '#10b981', flex: 1, padding: '10px' }}>
                {markAsCollected ? 'Finalize & Print' : 'Update Payment'}
              </button>
              <button onClick={() => setSelectedOrder(null)} style={{ ...clearBtnStyle, flex: 1 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Styles ---
const paginationContainer = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '20px' };
const pageBtnStyle = { padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' };
const tableContainerStyle = { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid #e2e8f0' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' };
const thStyle = { padding: '16px', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' };
const tdStyle = { padding: '16px', borderBottom: '1px solid #f1f5f9', color: '#334155' };
const rowStyle = { transition: 'background-color 0.2s' };
const headerRowStyle = { borderTop: 'none' };
const actionBtnStyle = { padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' };
const refreshBtnStyle = { padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' };
const filterBarContainer = { display: 'flex', gap: '15px', backgroundColor: '#fff', padding: '15px', borderRadius: '12px', marginBottom: '20px' };
const filterInput = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' };
const clearBtnStyle = { padding: '10px 15px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: '#fff', padding: '25px', borderRadius: '12px', width: '350px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' };

export default Orders;