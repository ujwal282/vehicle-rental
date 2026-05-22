import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ShieldAlert, Car, MapPin, Users, Package,
  Plus, Trash2, Edit2, X, Check, Upload
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ─────────── Helpers ─────────── */
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

/* ─────────── Sub-panels ─────────── */

/** Vehicle Management Panel */
const VehiclePanel = () => {
  const { addToast } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [form, setForm] = useState({
    name: '', type: 'Car', brand: '', model: '',
    fuelType: 'Petrol', rentPerDay: '', fuelEfficiency: '15', status: 'available'
  });

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/vehicles`);
      if (res.data.success) setVehicles(res.data.data);
    } catch { addToast('Failed to fetch vehicles', 'error'); }
    finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const resetForm = () => {
    setForm({ name: '', type: 'Car', brand: '', model: '', fuelType: 'Petrol', rentPerDay: '', fuelEfficiency: '15', status: 'available' });
    setImageFile(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (v) => {
    setForm({ name: v.name, type: v.type, brand: v.brand, model: v.model, fuelType: v.fuelType, rentPerDay: v.rentPerDay, fuelEfficiency: v.fuelEfficiency, status: v.status });
    setEditingId(v._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (imageFile) fd.append('image', imageFile);

    try {
      if (editingId) {
        await axios.put(`${API_URL}/api/vehicles/${editingId}`, fd, { headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' } });
        addToast('Vehicle updated successfully', 'success');
      } else {
        await axios.post(`${API_URL}/api/vehicles`, fd, { headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' } });
        addToast('Vehicle added successfully', 'success');
      }
      resetForm();
      fetchVehicles();
    } catch (err) {
      addToast(err.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this vehicle?')) return;
    try {
      await axios.delete(`${API_URL}/api/vehicles/${id}`, { headers: authHeaders() });
      addToast('Vehicle deleted', 'success');
      fetchVehicles();
    } catch (err) {
      addToast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', textTransform: 'uppercase' }}>Fleet Management ({vehicles.length})</h2>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn" style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {showForm ? <><X size={14} /><span>Close</span></> : <><Plus size={14} /><span>Add Vehicle</span></>}
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '28px', backgroundColor: 'var(--badge-bg)' }}>
          <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', marginBottom: '20px' }}>
            {editingId ? 'Edit Vehicle' : 'New Vehicle'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid-cols-3">
              <div><label>Vehicle Name</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Model Y" required /></div>
              <div><label>Brand</label><input value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} placeholder="e.g. Tesla" required /></div>
              <div><label>Model / Year</label><input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} placeholder="e.g. 2023 LR" required /></div>
            </div>
            <div className="grid-cols-3">
              <div>
                <label>Class Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  {['Bike', 'Car', 'SUV', 'EV'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label>Fuel Type</label>
                <select value={form.fuelType} onChange={e => setForm(p => ({ ...p, fuelType: e.target.value }))}>
                  {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label>Availability Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  {['available', 'rented', 'maintenance'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid-cols-3">
              <div><label>Daily Rent (NRS)</label><input type="number" value={form.rentPerDay} onChange={e => setForm(p => ({ ...p, rentPerDay: e.target.value }))} placeholder="e.g. 2500" required /></div>
              <div><label>Fuel Efficiency (km/l)</label><input type="number" value={form.fuelEfficiency} onChange={e => setForm(p => ({ ...p, fuelEfficiency: e.target.value }))} placeholder="e.g. 18" /></div>
              <div>
                <label>Vehicle Image</label>
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} style={{ cursor: 'pointer' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn" style={{ padding: '10px 24px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} /><span>{editingId ? 'Save Changes' : 'Add Vehicle'}</span>
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Vehicles Table */}
      {loading ? (
        <p style={{ opacity: 0.6 }}>Loading fleet data...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Vehicle</th><th>Type</th><th>Fuel</th><th>Rate/Day</th><th>Efficiency</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v._id}>
                  <td><strong>{v.brand} {v.name}</strong><br /><span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{v.model}</span></td>
                  <td><span className="badge">{v.type}</span></td>
                  <td>{v.fuelType}</td>
                  <td>NRS {v.rentPerDay}</td>
                  <td>{v.fuelEfficiency} km/l</td>
                  <td><span className="badge" style={{ borderStyle: v.status === 'available' ? 'solid' : 'dashed' }}>{v.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(v)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Edit2 size={12} /><span>Edit</span>
                      </button>
                      <button onClick={() => handleDelete(v._id)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Trash2 size={12} /><span>Del</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/** Location Branch Management Panel */
const LocationPanel = () => {
  const { addToast } = useToast();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', latitude: '', longitude: '' });

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/locations`);
      if (res.data.success) setLocations(res.data.data);
    } catch { addToast('Failed to fetch locations', 'error'); }
    finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const resetForm = () => {
    setForm({ name: '', latitude: '', longitude: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (loc) => {
    setForm({ name: loc.name, latitude: loc.latitude, longitude: loc.longitude });
    setEditingId(loc._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/api/locations/${editingId}`, form, { headers: authHeaders() });
        addToast('Branch updated', 'success');
      } else {
        await axios.post(`${API_URL}/api/locations`, form, { headers: authHeaders() });
        addToast('Branch created', 'success');
      }
      resetForm();
      fetchLocations();
    } catch (err) {
      addToast(err.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this branch?')) return;
    try {
      await axios.delete(`${API_URL}/api/locations/${id}`, { headers: authHeaders() });
      addToast('Branch deleted', 'success');
      fetchLocations();
    } catch (err) {
      addToast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', textTransform: 'uppercase' }}>Rental Branches ({locations.length})</h2>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn" style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {showForm ? <><X size={14} /><span>Close</span></> : <><Plus size={14} /><span>Add Branch</span></>}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '28px', backgroundColor: 'var(--badge-bg)' }}>
          <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', marginBottom: '20px' }}>{editingId ? 'Edit Branch' : 'New Branch'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid-cols-3">
              <div style={{ gridColumn: '1 / span 1' }}><label>Branch Name</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Airport Terminal" required /></div>
              <div><label>Latitude</label><input type="number" step="0.000001" value={form.latitude} onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))} placeholder="27.6980" required /></div>
              <div><label>Longitude</label><input type="number" step="0.000001" value={form.longitude} onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))} placeholder="85.3590" required /></div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn" style={{ padding: '10px 24px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} /><span>{editingId ? 'Save Changes' : 'Add Branch'}</span>
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ opacity: 0.6 }}>Loading branch data...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr><th>Branch Name</th><th>Latitude</th><th>Longitude</th><th>Vehicles Linked</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {locations.map(loc => (
                <tr key={loc._id}>
                  <td><strong>{loc.name}</strong></td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{loc.latitude}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{loc.longitude}</td>
                  <td><span className="badge">{loc.availableVehicles?.length || 0} vehicles</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(loc)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Edit2 size={12} /><span>Edit</span>
                      </button>
                      <button onClick={() => handleDelete(loc._id)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Trash2 size={12} /><span>Del</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/** All Bookings Panel (admin-only) */
const BookingsPanel = () => {
  const { addToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/bookings`, { headers: authHeaders() });
      if (res.data.success) setBookings(res.data.data);
    } catch { addToast('Failed to fetch bookings', 'error'); }
    finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const statusStyle = (s) => {
    if (s === 'Confirmed') return { border: '1px solid var(--text-color)' };
    if (s === 'Cancelled') return { opacity: 0.5, borderStyle: 'dashed' };
    return {};
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.4rem', textTransform: 'uppercase', marginBottom: '24px' }}>All System Bookings ({bookings.length})</h2>

      {loading ? (
        <p style={{ opacity: 0.6 }}>Loading booking records...</p>
      ) : bookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', opacity: 0.6, padding: '40px' }}><p>No bookings in system yet.</p></div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr><th>Booking ID</th><th>User</th><th>Vehicle</th><th>Dates</th><th>Total (NRS)</th><th>Status</th></tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b._id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{b.bookingId}</td>
                  <td>
                    <strong>{b.user?.name}</strong><br />
                    <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{b.user?.email}</span>
                  </td>
                  <td>{b.vehicle?.brand} {b.vehicle?.name}<br /><span className="badge" style={{ fontSize: '0.7rem', marginTop: '4px' }}>{b.vehicle?.type}</span></td>
                  <td style={{ fontSize: '0.85rem' }}>{formatDate(b.pickupDate)}<br /><span style={{ opacity: 0.6 }}>to {formatDate(b.returnDate)}</span></td>
                  <td><strong>NRS {b.totalPrice}</strong></td>
                  <td><span className="badge" style={statusStyle(b.bookingStatus)}>{b.bookingStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ─────────── Main Admin Page ─────────── */
const TABS = [
  { key: 'vehicles', label: 'Fleet', icon: Car },
  { key: 'locations', label: 'Branches', icon: MapPin },
  { key: 'bookings', label: 'All Bookings', icon: Package },
];

const Admin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('vehicles');

  if (!user || user.role !== 'admin') {
    return (
      <div className="container" style={{ marginTop: '80px', textAlign: 'center', opacity: 0.6 }}>
        <ShieldAlert size={48} style={{ margin: '0 auto 16px auto' }} />
        <p style={{ fontSize: '1.2rem' }}>Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: '40px' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <ShieldAlert size={24} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>
            SYSTEM ADMINISTRATION
          </h1>
        </div>
        <p style={{ opacity: 0.6, fontSize: '1rem' }}>
          Manage fleet inventory, branch networks, and all booking reservations.
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border-color)', marginBottom: '32px' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--text-color)' : '2px solid transparent',
                color: 'var(--text-color)',
                padding: '12px 24px',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isActive ? 1 : 0.5,
                transition: 'all 0.15s ease',
                marginBottom: '-1px',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Panel */}
      {activeTab === 'vehicles' && <VehiclePanel />}
      {activeTab === 'locations' && <LocationPanel />}
      {activeTab === 'bookings' && <BookingsPanel />}
    </div>
  );
};

export default Admin;
