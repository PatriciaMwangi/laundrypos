import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';


const Register = () => {
    const [step, setStep] = useState(1);
    const [logoFile, setLogoFile] = useState(null);
    const [formData, setFormData] = useState({
        // Business Table Fields
        name: '', kra_pin: '', county: '', location: '', landmark: '', logo: '',
        // User Table Fields (Owner)
        full_name: '', username: '', password: ''
    });
    const navigate = useNavigate();

  const handleRegister = async () => {
    const data = new FormData();
    
    // Append all text fields
    Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
    });
    
    // Append the logo file
    if (logoFile) {
        data.append('logo', logoFile);
    }

    try {
        await api.post('/auth/register', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert("Registration Successful!");
        navigate('/login');
    } catch (err) {
        alert("Error during registration.");
    }
};

    return (
        <div className="reg-bg" style={{ backgroundColor: '#5D3FD3', minHeight: '100vh', padding: '50px 0' }}>
            <div className="reg-card" style={{ backgroundColor: '#fff', maxWidth: '800px', margin: '0 auto', borderRadius: '8px', padding: '40px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h2 style={{ color: '#333' }}>LaundryPOS</h2>
                    <p style={{ color: '#666' }}>Register and Get Started in minutes</p>
                </div>

                {/* Progress Tabs */}
                <div style={{ display: 'flex', marginBottom: '30px', borderBottom: '1px solid #eee' }}>
                    <div style={{ flex: 1, padding: '15px', textAlign: 'center', backgroundColor: step === 1 ? '#007bff' : '#f8f9fa', color: step === 1 ? '#fff' : '#666', borderRadius: '5px 5px 0 0' }}>
                        1. Business
                    </div>
                    <div style={{ flex: 1, padding: '15px', textAlign: 'center', backgroundColor: step === 2 ? '#007bff' : '#f8f9fa', color: step === 2 ? '#fff' : '#666', borderRadius: '5px 5px 0 0' }}>
                        2. Owner Information
                    </div>
                </div>

                {step === 1 ? (
                    /* STEP 1: BUSINESS DETAILS */
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label>Business Name:*</label>
                            <input type="text" placeholder="Laundry Name" style={inputStyle} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        {/* <div className="input-group">
                            <label>KRA PIN:</label>
                            <input type="text" placeholder="P051..." style={inputStyle} onChange={e => setFormData({...formData, kra_pin: e.target.value})} />
                        </div> */}
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
    <label>Upload Logo:</label>
    <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
        <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => setLogoFile(e.target.files[0])} 
            style={{ padding: '10px', border: '1px solid #ddd', flex: 1 }}
        />
    </div>
</div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label>County:*</label>
                            <input type="text" placeholder="Nairobi" style={inputStyle} onChange={e => setFormData({...formData, county: e.target.value})} />
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label>Location (Area):</label>
                            <input type="text" placeholder="Westlands" style={inputStyle} onChange={e => setFormData({...formData, location: e.target.value})} />
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label>Landmark:</label>
                            <input type="text" placeholder="Near XYZ Stage" style={inputStyle} onChange={e => setFormData({...formData, landmark: e.target.value})} />
                        </div>
                        <button style={btnStyle} onClick={() => setStep(2)}>Next: Owner Info</button>
                    </div>
                ) : (
                    /* STEP 2: OWNER INFORMATION */
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label>Owner Full Name:*</label>
                            <input type="text" placeholder="John Doe" style={inputStyle} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label>Username:*</label>
                            <input type="text" placeholder="admin123" style={inputStyle} onChange={e => setFormData({...formData, username: e.target.value})} />
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                            <label>Password:*</label>
                            <input type="password" placeholder="********" style={inputStyle} onChange={e => setFormData({...formData, password: e.target.value})} />
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px' }}>
                            <button style={{...btnStyle, backgroundColor: '#6c757d'}} onClick={() => setStep(1)}>Back</button>
                            <button style={btnStyle} onClick={handleRegister}>Finish & Register</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const inputStyle = { width: '100%', padding: '12px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };
const btnStyle = { padding: '12px 25px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px', flex: 1 };

export default Register;