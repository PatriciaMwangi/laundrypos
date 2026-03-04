import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';

// ✅ FIX 1: Parse user ONCE outside component to prevent re-parsing on every render
const getUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch {
        return null;
    }
};

// Helper to get date string (YYYY-MM-DD)
function getFutureDate(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

const Pos = () => {
    const [phone, setPhone] = useState('');
    const [customer, setCustomer] = useState({ first_name: '', last_name: '', customer_id: null, physical_address: '' });
    const [cart, setCart] = useState([]);
    const [products, setProducts] = useState([]);
    const [businessData, setBusinessData] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [paidAmount, setPaidAmount] = useState(0);
    const [collectionDate, setCollectionDate] = useState(getFutureDate(3));

    // ✅ FIX 2: Memoize user so it doesn't change reference on every render
    const user = useMemo(() => getUser(), []);

    // ✅ FIX 3: Memoize orderNumber so Date.now() doesn't re-run on every render
    const [orderNumber] = useState(() => `ORD-${Date.now()}`);

    // Filter products based on search
    const filteredProducts = useMemo(() =>
        products.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase())),
        [products, searchTerm]
    );

    useEffect(() => {
        if (!user?.business_id) {
            setLoading(false);
            return;
        }

        // ✅ FIX 4: Fetch both in parallel with Promise.all instead of sequentially
        const fetchData = async () => {
            try {
                const [productsRes, businessRes] = await Promise.all([
                    api.get(`/laundry/products/${user.business_id}`),
                    // api.get(`/laundry/business/${user.business_id}`)
                ]);
                setProducts(productsRes.data);
                // setBusinessData(businessRes.data);
            } catch (err) {
                console.error("Failed to fetch data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.business_id]); // ✅ Now stable because user is memoized

    const handlePhoneSearch = async (val) => {
        setPhone(val);
        if (val.length >= 10) {
            try {
                const res = await api.get(`/laundry/customers/${val}`);
                if (res.data) setCustomer(res.data);
            } catch {
                console.log("New customer, details required.");
            }
        }
    };

    const addToCart = (product) => {
        setCart(prevCart => {
            const existingIndex = prevCart.findIndex(item => item.product_id === product.product_id);
            if (existingIndex > -1) {
                const newCart = [...prevCart];
                const item = newCart[existingIndex];
                const newQty = item.quantity + 1;
                newCart[existingIndex] = { ...item, quantity: newQty, subtotal: newQty * item.price };
                return newCart;
            }
            return [...prevCart, { ...product, quantity: 1, subtotal: product.price, notes: '' }];
        });
    };

    const total = useMemo(() => cart.reduce((sum, item) => sum + item.subtotal, 0), [cart]);

    // ✅ FIX 5: Receipt CSS now forces 80mm page size so it doesn't print in a corner
    const printReceipt = () => {
        const printWindow = window.open('', '_blank', 'width=400,height=650');

        const receiptHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }

                    @page {
                        size: 80mm auto;   /* ✅ Thermal receipt size */
                        margin: 5mm;
                    }

                    body {
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        width: 80mm;
                        margin: 0 auto; /* ✅ Centre on screen preview */
                        padding: 8px;
                        color: #000;
                        background: #fff;
                    }

                    h2 { text-align: center; font-size: 15px; margin-bottom: 2px; }
                    .sub { text-align: center; font-size: 11px; margin: 1px 0; }
                    .divider { border-top: 1px dashed #000; margin: 8px 0; }
                    h3 { text-align: center; padding: 4px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; font-size: 13px; }
                    p { margin: 2px 0; }

                    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                    thead tr { border-bottom: 1px solid #000; }
                    th { text-align: left; padding: 3px 0; }
                    th:nth-child(2) { text-align: center; }
                    th:nth-child(3) { text-align: right; }
                    td { padding: 2px 0; }
                    td:nth-child(2) { text-align: center; }
                    td:nth-child(3) { text-align: right; }

                    .totals { border-top: 1px solid #000; margin-top: 8px; padding-top: 5px; }
                    .totals div { display: flex; justify-content: space-between; margin: 2px 0; }
                    .balance { color: ${total - paidAmount > 0 ? 'red' : 'black'}; }
                    .footer { text-align: center; margin-top: 12px; font-size: 11px; }
                </style>
            </head>
            <body>
                <h2>'Mzalendo'</h2>
                <p class="sub">+ ' County' : ''}</p>
                <p class="sub">''}</p>
                <p class="sub"> ''}</p>

                <h3>CASH RECEIPT</h3>

                <p><strong>Order:</strong> ${orderNumber}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Cust:</strong> ${customer.first_name} ${customer.last_name || ''}</p>
                <p><strong>Phone:</strong> ${phone}</p>

                <table>
                    <thead>
                        <tr><th>Item</th><th>Qty</th><th>Total</th></tr>
                    </thead>
                    <tbody>
                        ${cart.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>KES ${item.subtotal}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="totals">
                    <div><span>Subtotal:</span><span>KES ${total}</span></div>
                    <div><strong><span>TOTAL PAID:</span><span>KES ${paidAmount}</span></strong></div>
                    <div class="balance"><span>BALANCE:</span><span>KES ${total - paidAmount}</span></div>
                </div>

                <div class="footer">
                    <p>Collection Date: ${new Date(collectionDate).toLocaleDateString()}</p>
                    <div class="divider"></div>
                    <p>*** Thank you! ***</p>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        printWindow.focus();
        // ✅ FIX 6: Small delay so styles are applied before print dialog opens
        setTimeout(() => printWindow.print(), 300);
    };

    const submitOrder = async () => {
        const orderPayload = {
            business_id: user.business_id,
            physical_address: customer.physical_address || null,
            customer_id: customer.customer_id,
            first_name: customer.first_name,
            last_name: customer.last_name,
            phone,
            staff_id: user.id,
            order_number: orderNumber,
            total_amount: total,
            collection_date: collectionDate || getFutureDate(3),
            amount_paid: paidAmount,
            balance: total - paidAmount,
            items: cart.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.price,
                subtotal: item.subtotal,
                notes: item.notes
            }))
        };

        try {
            await api.post('/laundry/create-order', orderPayload);
            printReceipt();
            alert("Order Recorded & Printing...");
            setCart([]);
            setPhone('');
            setCustomer({ first_name: '', last_name: '', customer_id: null, physical_address: '' });
            setPaidAmount(0);
            setSearchTerm('');
        } catch (err) {
            alert("Error: " + (err.response?.data?.error || err.message));
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading services...</div>;

    return (
        <div className="no-print" style={{ display: 'flex', gap: '25px', padding: '20px', backgroundColor: '#f4f7fe', minHeight: '90vh' }}>

            {/* Left Side */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Customer Card */}
                <div style={cardStyle}>
                    <h3 style={cardTitleStyle}>👤 Customer Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={labelStyle}>Phone Number</label>
                            <input style={inputStyle} placeholder="07..." value={phone} onChange={(e) => handlePhoneSearch(e.target.value)} />
                        </div>
                        <div>
                            <label style={labelStyle}>First Name</label>
                            <input style={inputStyle} placeholder="John" value={customer.first_name} onChange={(e) => setCustomer({ ...customer, first_name: e.target.value })} />
                        </div>
                        <div>
                            <label style={labelStyle}>Last Name</label>
                            <input style={inputStyle} placeholder="Doe" value={customer.last_name || ''} onChange={(e) => setCustomer({ ...customer, last_name: e.target.value })} />
                        </div>
                        <div>
                            <label style={labelStyle}>Delivery Location (Optional)</label>
                            <input style={inputStyle} placeholder="Apartment/Street" value={customer.physical_address || ''} onChange={(e) => setCustomer({ ...customer, physical_address: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Services Grid */}
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                        <h3 style={{ margin: 0 }}>🧺 Select Services</h3>
                        <div style={{ position: 'relative', width: '250px' }}>
                            <input type="text" placeholder="Search service..." style={{ ...inputStyle, marginTop: 0, paddingLeft: '35px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                        {filteredProducts.length > 0 ? (
                            filteredProducts.slice(0, 4).map(p => (
                                <button key={p.product_id} onClick={() => addToCart(p)} style={serviceButtonStyle}>
                                    <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                                    <div style={{ color: '#5D3FD3', fontSize: '0.9em' }}>KES {p.price}</div>
                                </button>
                            ))
                        ) : (
                            <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                                No services match "{searchTerm}"
                            </p>
                        )}
                    </div>

                    {filteredProducts.length > 4 && (
                        <p style={{ fontSize: '11px', color: '#999', textAlign: 'center', margin: '5px 0' }}>
                            Showing top 4 results. Use search to find more.
                        </p>
                    )}

                    <div>
                        <label style={labelStyle}>Approximate Due Date</label>
                        <input type="date" style={inputStyle} value={collectionDate} onChange={(e) => setCollectionDate(e.target.value)} />
                        <p style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Default is 3 days from today.</p>
                    </div>
                </div>

                {/* Payment */}
                <div style={cardStyle}>
                    <h3 style={cardTitleStyle}>💳 Payment at Drop-off</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={labelStyle}>Amount Paid</label>
                            <input type="number" style={inputStyle} placeholder="KES 0.00" value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} />
                        </div>
                        <div>
                            <label style={labelStyle}>Balance Due</label>
                            <div style={{ ...inputStyle, backgroundColor: '#f8fafc', fontWeight: 'bold', color: total - paidAmount > 0 ? '#e11d48' : '#000' }}>
                                KES {total - paidAmount}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Receipt Preview */}
            <div style={{ flex: 1 }}>
                <div style={{ ...receiptCardStyle, position: 'sticky', top: '20px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                        <h2 style={{ margin: '0 0 5px 0', fontSize: '20px', textTransform: 'uppercase' }}>
                            { 'Mzalendo'}
                        </h2>
                        <p style={receiptSmallText}>  County</p>
                        <p style={receiptSmallText}>{ ''}</p>
                        <p style={receiptSmallText}>Near: ""</p>
                        <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>
                    </div>

                    <div style={{ width: '100%', color: '#000' }}>
                        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                            <h3 style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '5px 0' }}>CASH RECEIPT</h3>
                        </div>

                        <div style={{ fontSize: '12px', marginBottom: '10px' }}>
                            <p><strong>Order:</strong> {orderNumber}</p>
                            <p><strong>Date:</strong> {new Date().toLocaleString()}</p>
                            <p><strong>Cust:</strong> {customer.first_name} {customer.last_name}</p>
                            <p><strong>Phone:</strong> {phone}</p>
                        </div>

                        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #000' }}>
                                    <th style={{ textAlign: 'left' }}>Item</th>
                                    <th style={{ textAlign: 'center' }}>Qty</th>
                                    <th style={{ textAlign: 'right' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.name}</td>
                                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                        <td style={{ textAlign: 'right' }}>KES {item.subtotal}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ borderTop: '1px solid #000', marginTop: '10px', paddingTop: '5px', fontSize: '13px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Subtotal:</span><span>KES {total}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                <span>TOTAL PAID:</span><span>KES {paidAmount}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: total - paidAmount > 0 ? 'red' : 'black' }}>
                                <span>BALANCE:</span><span>KES {total - paidAmount}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '11px' }}>
                            <p>Collection Date: {new Date(collectionDate).toLocaleDateString()}</p>
                            <p>*** Thank you! ***</p>
                        </div>

                        <button
                            onClick={submitOrder}
                            disabled={!customer.first_name || cart.length === 0}
                            style={{
                                ...submitButtonStyle,
                                marginTop: '15px',
                                backgroundColor: (!customer.first_name || cart.length === 0) ? '#ccc' : '#000',
                                color: '#fff',
                                borderRadius: '0'
                            }}
                        >
                            PROCESS & PRINT
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const receiptCardStyle = {
    backgroundColor: '#fff',
    padding: '25px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    fontFamily: '"Courier New", Courier, monospace',
    color: '#000',
    border: '1px solid #ddd'
};
const receiptSmallText = { margin: '0', fontSize: '11px', color: '#333' };
const cardStyle = { backgroundColor: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #eef0f7' };
const cardTitleStyle = { marginTop: 0, marginBottom: '20px', fontSize: '18px', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '10px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', marginTop: '5px', fontSize: '14px' };
const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#666' };
const serviceButtonStyle = { padding: '15px', border: '1px solid #5D3FD3', backgroundColor: '#fff', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', transition: '0.2s', color: '#333' };
const submitButtonStyle = { width: '100%', padding: '15px', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' };

export default Pos;