import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserPlus } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lat, setLat] = useState('27.6850'); // Default Lalitpur
  const [lng, setLng] = useState('85.3200');

  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude.toFixed(6));
          setLng(position.coords.longitude.toFixed(6));
          addToast('GPS Coordinates updated from browser!', 'success');
        },
        (error) => {
          addToast('Could not retrieve browser GPS. Using Kathmandu defaults.', 'error');
        }
      );
    } else {
      addToast('Geolocation not supported by browser', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      addToast('Please fill in all fields', 'error');
      return;
    }

    setSubmitting(true);
    const result = await register(name, email, password, 'user', Number(lat), Number(lng));
    setSubmitting(false);

    if (result.success) {
      addToast('Account created successfully!', 'success');
      navigate('/');
    } else {
      addToast(result.message, 'error');
    }
  };

  return (
    <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '40px auto' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
        <h2 style={{ marginBottom: '8px', fontSize: '1.8rem', textAlign: 'center' }}>CREATE ACCOUNT</h2>
        <p style={{ opacity: 0.6, fontSize: '0.9rem', textAlign: 'center', marginBottom: '24px' }}>Register to rent vehicles and find nearest branches</p>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="e.g. john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>


          <div style={{ border: '1px dashed var(--border-color)', padding: '16px', marginBottom: '20px' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              📍 Location Coordinates
            </span>
            <div className="grid-cols-2">
              <div>
                <label htmlFor="lat" style={{ fontSize: '0.75rem' }}>Latitude</label>
                <input
                  type="number"
                  id="lat"
                  step="0.000001"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  style={{ marginBottom: '0' }}
                  required
                />
              </div>
              <div>
                <label htmlFor="lng" style={{ fontSize: '0.75rem' }}>Longitude</label>
                <input
                  type="number"
                  id="lng"
                  step="0.000001"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  style={{ marginBottom: '0' }}
                  required
                />
              </div>
            </div>
            <button type="button" onClick={handleGetCurrentLocation} className="btn btn-secondary" style={{ width: '100%', marginTop: '12px', fontSize: '0.75rem', padding: '8px' }}>
              Fetch GPS from Browser
            </button>
          </div>

          <button type="submit" className="btn" style={{ width: '100%', marginTop: '8px' }} disabled={submitting}>
            <UserPlus size={16} />
            <span>{submitting ? 'Registering...' : 'Register'}</span>
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem' }}>
          <span style={{ opacity: 0.6 }}>Already registered? </span>
          <Link to="/login" style={{ fontWeight: 600, borderBottom: '1px solid var(--text-color)' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
