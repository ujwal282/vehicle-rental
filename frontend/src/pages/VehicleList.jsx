import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Car, CheckCircle, Wrench, BarChart2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${API_URL}/${cleanPath}`;
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card" style={{
    display: 'flex', flexDirection: 'column', gap: '12px',
    borderLeft: `3px solid ${color || 'var(--text-color)'}`,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.7 }}>
      <Icon size={16} />
      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</span>
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', fontFamily: 'var(--font-heading)' }}>{value}</div>
  </div>
);

const VehicleList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, bRes] = await Promise.all([
        axios.get(`${API_URL}/api/vehicles`),
        axios.get(`${API_URL}/api/bookings`, { headers: authHeaders() }),
      ]);
      if (vRes.data.success) setVehicles(vRes.data.data);
      if (bRes.data.success) setBookings(bRes.data.data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Build per-vehicle stats from bookings
  const vehicleStats = vehicles.map(v => {
    const vBookings = bookings.filter(b => b.vehicle?._id === v._id || b.vehicle === v._id);
    const rented    = vBookings.filter(b => ['Confirmed', 'Completed'].includes(b.bookingStatus));
    const revenue   = rented.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    return { ...v, rentCount: rented.length, revenue, totalBookings: vBookings.length };
  });

  const totalVehicles   = vehicles.length;
  const available       = vehicles.filter(v => v.status === 'available').length;
  const rented          = vehicles.filter(v => v.status === 'rented').length;
  const maintenance     = vehicles.filter(v => v.status === 'maintenance').length;
  const totalRentals    = bookings.filter(b => ['Confirmed', 'Completed'].includes(b.bookingStatus)).length;

  const statusColor = (s) => ({
    available:   '#4ade80',
    rented:      '#60a5fa',
    maintenance: '#fbbf24',
  }[s] || 'var(--text-color)');

  return (
    <div className="container" style={{ marginTop: '40px', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <Car size={24} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>
            VEHICLE RENT LIST
          </h1>
        </div>
        <p style={{ opacity: 0.6, fontSize: '1rem' }}>
          Full fleet overview — how many times each vehicle was rented and revenue generated.
        </p>
      </div>

      {loading ? (
        <p style={{ opacity: 0.6 }}>Loading fleet data...</p>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid-cols-3" style={{ marginBottom: '40px' }}>
            <StatCard icon={Car}         label="Total Vehicles"    value={totalVehicles}  color="#a78bfa" />
            <StatCard icon={CheckCircle} label="Available Now"     value={available}      color="#4ade80" />
            <StatCard icon={BarChart2}   label="Total Rentals"     value={totalRentals}   color="#60a5fa" />
          </div>

          <div className="grid-cols-3" style={{ marginBottom: '40px' }}>
            <StatCard icon={Car}     label="Currently Rented"   value={rented}      color="#60a5fa" />
            <StatCard icon={Wrench}  label="In Maintenance"     value={maintenance} color="#fbbf24" />
            <StatCard icon={BarChart2} label="Total Fleet Revenue"
              value={`NRS ${bookings.filter(b=>['Confirmed','Completed'].includes(b.bookingStatus)).reduce((s,b)=>s+(b.totalPrice||0),0).toLocaleString()}`}
              color="#4ade80"
            />
          </div>

          {/* Vehicle Table */}
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', fontWeight: 700 }}>
              Per-Vehicle Rental Stats ({vehicles.length})
            </h2>
          </div>

          {vehicles.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', opacity: 0.6, padding: '40px' }}>
              <p>No vehicles found in the system.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th>Fuel</th>
                    <th>Rate / Day</th>
                    <th>Times Rented</th>
                    <th>Revenue Earned</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicleStats.sort((a, b) => b.rentCount - a.rentCount).map(v => (
                    <tr key={v._id}>
                      <td>
                        <div style={{
                          width: '72px', height: '48px',
                          backgroundColor: 'var(--badge-bg)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {v.image ? (
                            <img
                              src={getImageUrl(v.image)}
                              alt={`${v.brand} ${v.name}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <Car size={20} style={{ opacity: 0.3 }} />
                          )}
                        </div>
                      </td>
                      <td>
                        <strong>{v.brand} {v.name}</strong><br />
                        <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{v.model}</span>
                      </td>
                      <td><span className="badge">{v.type}</span></td>
                      <td>{v.fuelType}</td>
                      <td>NRS {v.rentPerDay?.toLocaleString()}</td>
                      <td>
                        <strong style={{ fontSize: '1.1rem' }}>{v.rentCount}</strong>
                        <span style={{ opacity: 0.5, fontSize: '0.75rem', marginLeft: '4px' }}>
                          ({v.totalBookings} total)
                        </span>
                      </td>
                      <td><strong>NRS {v.revenue.toLocaleString()}</strong></td>
                      <td>
                        <span className="badge" style={{
                          borderColor: statusColor(v.status),
                          color: statusColor(v.status),
                          borderStyle: v.status === 'available' ? 'solid' : 'dashed',
                        }}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VehicleList;
