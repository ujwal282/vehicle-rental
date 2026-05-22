import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Calendar, Trash2, ShieldCheck, MapPin, Tag, Clock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${API_URL}/${cleanPath}`;
};

const History = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setBookings(res.data.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to retrieve bookings history', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you absolutely sure you want to cancel this booking reservation?')) {
      return;
    }

    setCancellingId(bookingId);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${API_URL}/api/bookings/${bookingId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data.success) {
        addToast('Booking cancelled successfully and vehicle released!', 'success');
        // Refresh booking history
        fetchBookings();
      } else {
        addToast(res.data.message || 'Failed to cancel reservation.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Error occurred during cancellation.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper to determine if cancellation is allowed (strictly BEFORE pickupDate)
  const isCancellationAllowed = (pickupDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pickup = new Date(pickupDateStr);
    pickup.setHours(0, 0, 0, 0);
    return today < pickup;
  };

  return (
    <div className="container" style={{ marginTop: '40px' }}>
      
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>
          MY BOOKINGS HISTORY
        </h1>
        <p style={{ opacity: 0.6, fontSize: '1rem', marginTop: '4px' }}>
          Monitor your active vehicle reservation states, payments, and cancellation schedules.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.6 }}>
          <p>Analyzing reservations history...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
          <p>You do not have any bookings registered in the system yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {bookings.map((booking) => {
            const isPaid = booking.bookingStatus === 'Confirmed';
            const cancellable = isCancellationAllowed(booking.pickupDate) && booking.bookingStatus !== 'Cancelled' && !isPaid;

            return (
              <div
                key={booking._id}
                className="card"
                style={{
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '24px',
                }}
              >
                <div style={{ flex: 1, minWidth: '280px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  {booking.vehicle?.image && (
                    <div style={{ width: '130px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--badge-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                      <img 
                        src={getImageUrl(booking.vehicle.image)} 
                        alt={`${booking.vehicle.brand} ${booking.vehicle.name}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                      />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <span className="badge" style={{ backgroundColor: 'var(--text-color)', color: 'var(--bg-color)', border: 'none', fontWeight: 'bold' }}>
                        {booking.bookingId}
                      </span>
                      <span className="badge">
                        {booking.bookingStatus}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.3rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                      {booking.vehicle?.brand} {booking.vehicle?.name}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', opacity: 0.8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} />
                        <span>Timeline: {formatDate(booking.pickupDate)} to {formatDate(booking.returnDate)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} />
                        <span>Pickup Station: {booking.pickupLocation?.name || 'Main branch'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Tag size={14} />
                        <span>Allocated Class: {booking.vehicle?.type} | Fuel Type: {booking.vehicle?.fuelType}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block' }}>TOTAL PRICE RESERVED</span>
                    <strong style={{ fontSize: '1.5rem' }}>NRS {booking.totalPrice}</strong>
                  </div>

                  {cancellable ? (
                    <button
                      onClick={() => handleCancelBooking(booking._id)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      disabled={cancellingId === booking._id}
                    >
                      <Trash2 size={12} />
                      <span>{cancellingId === booking._id ? 'Cancelling...' : 'Cancel Reservation'}</span>
                    </button>
                  ) : isPaid ? (
                    <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#4ade80' }}>
                      <ShieldCheck size={14} />
                      <span>Payment confirmed — cannot cancel</span>
                    </span>
                  ) : booking.bookingStatus === 'Cancelled' ? (
                    <span style={{ fontSize: '0.8rem', opacity: 0.5, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Cancelled and Released
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', opacity: 0.5, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      <span>Pickup active or past (Cancellation locked)</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;
