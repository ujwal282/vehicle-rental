import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { TrendingUp, DollarSign, CheckCircle, XCircle, Clock, CreditCard } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="card" style={{
    display: 'flex', flexDirection: 'column', gap: '12px',
    borderLeft: `3px solid ${color || 'var(--text-color)'}`,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.7 }}>
      <Icon size={16} />
      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</span>
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', fontFamily: 'var(--font-heading)' }}>{value}</div>
    {sub && <div style={{ fontSize: '0.78rem', opacity: 0.55 }}>{sub}</div>}
  </div>
);

const Earnings = () => {
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, pRes] = await Promise.all([
        axios.get(`${API_URL}/api/bookings`, { headers: authHeaders() }),
        axios.get(`${API_URL}/api/payments`, { headers: authHeaders() }),
      ]);
      if (bRes.data.success) setBookings(bRes.data.data);
      if (pRes.data.success) setPayments(pRes.data.data);
    } catch {
      // fallback: only bookings
      try {
        const bRes = await axios.get(`${API_URL}/api/bookings`, { headers: authHeaders() });
        if (bRes.data.success) setBookings(bRes.data.data);
      } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived stats from bookings
  const confirmed = bookings.filter(b => b.bookingStatus === 'Confirmed');
  const completed = bookings.filter(b => b.bookingStatus === 'Completed');
  const cancelled = bookings.filter(b => b.bookingStatus === 'Cancelled');
  const pending   = bookings.filter(b => b.bookingStatus === 'Pending');

  const totalRevenue = [...confirmed, ...completed].reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const completedRevenue = completed.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const confirmedRevenue = confirmed.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  // Payment stats
  const paidPayments = payments.filter(p => p.status === 'Completed');
  const totalPaid = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const formatNRS = (n) => `NRS ${n.toLocaleString()}`;
  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="container" style={{ marginTop: '40px', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <TrendingUp size={24} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>
            EARNINGS & PROFIT
          </h1>
        </div>
        <p style={{ opacity: 0.6, fontSize: '1rem' }}>
          Revenue breakdown, booking financials, and payment records.
        </p>
      </div>

      {loading ? (
        <p style={{ opacity: 0.6 }}>Loading financial data...</p>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid-cols-3" style={{ marginBottom: '40px' }}>
            <StatCard
              icon={DollarSign}
              label="Total Revenue"
              value={formatNRS(totalRevenue)}
              sub="From confirmed + completed bookings"
              color="#4ade80"
            />
            <StatCard
              icon={CreditCard}
              label="Payments Received"
              value={formatNRS(totalPaid || totalRevenue)}
              sub={`${paidPayments.length || confirmed.length + completed.length} successful transactions`}
              color="#60a5fa"
            />
            <StatCard
              icon={CheckCircle}
              label="Active Confirmed"
              value={formatNRS(confirmedRevenue)}
              sub={`${confirmed.length} bookings currently confirmed`}
              color="#a78bfa"
            />
          </div>

          <div className="grid-cols-3" style={{ marginBottom: '40px' }}>
            <StatCard
              icon={CheckCircle}
              label="Completed Bookings"
              value={completed.length}
              sub={formatNRS(completedRevenue) + ' earned'}
              color="#4ade80"
            />
            <StatCard
              icon={Clock}
              label="Pending Bookings"
              value={pending.length}
              sub="Awaiting confirmation"
              color="#fbbf24"
            />
            <StatCard
              icon={XCircle}
              label="Cancelled Bookings"
              value={cancelled.length}
              sub="Revenue lost"
              color="#f87171"
            />
          </div>

          {/* Booking Revenue Table */}
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', fontWeight: 700 }}>
              All Booking Revenue ({bookings.length})
            </h2>
          </div>

          {bookings.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', opacity: 0.6, padding: '40px' }}>
              <p>No booking records found.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Pickup Date</th>
                    <th>Return Date</th>
                    <th>Amount (NRS)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => {
                    const statusColor = {
                      Confirmed: '#4ade80',
                      Completed: '#60a5fa',
                      Cancelled: '#f87171',
                      Pending: '#fbbf24',
                    }[b.bookingStatus] || 'var(--text-color)';

                    return (
                      <tr key={b._id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{b.bookingId}</td>
                        <td>
                          <strong>{b.user?.name || '—'}</strong><br />
                          <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{b.user?.email}</span>
                        </td>
                        <td>{b.vehicle?.brand} {b.vehicle?.name}</td>
                        <td style={{ fontSize: '0.85rem' }}>{formatDate(b.pickupDate)}</td>
                        <td style={{ fontSize: '0.85rem' }}>{formatDate(b.returnDate)}</td>
                        <td><strong>NRS {b.totalPrice?.toLocaleString()}</strong></td>
                        <td>
                          <span className="badge" style={{ borderColor: statusColor, color: statusColor }}>
                            {b.bookingStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem', opacity: 0.7 }}>
                      Total Revenue (Confirmed + Completed)
                    </td>
                    <td colSpan={2} style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                      {formatNRS(totalRevenue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Earnings;
