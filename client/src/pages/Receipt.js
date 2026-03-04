import React from 'react';

const Receipt = ({ order, business, items }) => {
    return (
        <div id="printable-receipt" style={{ width: '300px', padding: '10px', fontFamily: 'monospace', fontSize: '12px' }}>
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ margin: '0' }}>{business.name}</h2>
                <p>{business.location} | {business.county}</p>
                {business.kra_pin && <p>KRA PIN: {business.kra_pin}</p>}
                <p>--------------------------------</p>
            </div>

            <p>Order: {order.order_number}</p>
            <p>Date: {new Date(order.created_at).toLocaleString()}</p>
            <p>Customer: {order.first_name} {order.last_name}</p>
            <p>--------------------------------</p>

            <table width="100%">
                <thead>
                    <tr style={{ textAlign: 'left' }}>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Sub</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, i) => (
                        <tr key={i}>
                            <td>{item.name}</td>
                            <td>{item.quantity}</td>
                            <td>{item.subtotal}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <p>--------------------------------</p>
            <div style={{ textAlign: 'right' }}>
                <p><strong>Total: KES {order.total_amount}</strong></p>
                <p>Paid: KES {order.amount_paid}</p>
                <p>Balance: KES {order.total_amount - order.amount_paid}</p>
            </div>

            <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <p>Expected Collection:</p>
                <p><strong>{new Date(order.collection_date).toLocaleDateString()}</strong></p>
                <p>Thank you for your business!</p>
            </div>
        </div>
    );
};

export default Receipt;