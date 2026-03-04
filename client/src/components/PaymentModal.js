import React, { useState } from 'react';
import api from '../api/axios';

const PaymentModal = ({ order, onComplete, onClose }) => {
  const [amount, setAmount] = useState(order.total_amount - order.amount_paid);
  const [method, setMethod] = useState('M-Pesa');

  const handlePayment = async () => {
    try {
      await api.patch(`/laundry/process-payment/${order.order_id}`, {
        amount_paid: amount,
        payment_method: method
      });
      alert("Payment Success!");
      onComplete(); // Refresh the orders list
    } catch (err) {
      alert("Payment failed");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Pay for Order {order.order_number}</h3>
        <p>Balance Due: KES {order.total_amount - order.amount_paid}</p>
        
        <label>Amount to Pay:</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        
        <label>Method:</label>
        <select onChange={(e) => setMethod(e.target.value)}>
          <option value="M-Pesa">M-Pesa</option>
          <option value="Cash">Cash</option>
        </select>

        <button onClick={handlePayment}>Confirm Payment</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default PaymentModal;