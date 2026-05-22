import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Calendar, MapPin, Car, CreditCard, ShieldAlert, Award, Calculator } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${API_URL}/${cleanPath}`;
};

const BookingDetails = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Booking parameters from query URL
  const vehicleId = searchParams.get('vehicleId');
  const pickupLocationId = searchParams.get('pickupLocationId');
  const pickupDateStr = searchParams.get('pickupDate');
  const returnDateStr = searchParams.get('returnDate');

  const [vehicle, setVehicle] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Fetch full details
  const fetchCheckoutDetails = useCallback(async () => {
    if (!vehicleId || !pickupLocationId || !pickupDateStr || !returnDateStr) {
      addToast('Missing booking checkout details', 'error');
      navigate('/');
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch vehicle with pricing
      const vehicleRes = await axios.get(
        `${API_URL}/api/vehicles/${vehicleId}?pickupDate=${pickupDateStr}&returnDate=${returnDateStr}`
      );
      // 2. Fetch location
      const locationRes = await axios.get(`${API_URL}/api/locations/${pickupLocationId}`);

      if (vehicleRes.data.success && locationRes.data.success) {
        setVehicle(vehicleRes.data.data);
        setLocation(locationRes.data.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load checkout details', 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [vehicleId, pickupLocationId, pickupDateStr, returnDateStr, addToast, navigate]);

  useEffect(() => {
    fetchCheckoutDetails();
  }, [fetchCheckoutDetails]);

  // Format dates for display
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleCheckout = async () => {
    if (!user) {
      addToast('Authentication is required', 'error');
      navigate('/login');
      return;
    }

    setProcessing(true);
    try {
      // Step 1: Create the Booking Draft in MERN Database (Lock pricing and run double booking checks)
      const bookingRes = await axios.post(`${API_URL}/api/bookings`, {
        vehicleId,
        pickupLocationId,
        pickupDate: pickupDateStr,
        returnDate: returnDateStr,
      });

      if (!bookingRes.data.success) {
        addToast(bookingRes.data.message || 'Failed to reserve booking draft', 'error');
        setProcessing(false);
        return;
      }

      const bookingData = bookingRes.data.data.booking;
      addToast('Booking reserved. Initiating checkout payment...', 'success');

      // Step 2: Request Khalti sandbox transaction session
      const paymentRes = await axios.post(`${API_URL}/api/payments/initiate`, {
        bookingId: bookingData._id,
      });

      if (paymentRes.data.success && paymentRes.data.data.payment_url) {
        const checkoutUrl = paymentRes.data.data.payment_url;
        
        if (paymentRes.data.data.isSimulated) {
          addToast('Developer Simulation mode enabled! Redirecting to mock payment...', 'success');
        } else {
          addToast('Redirecting to Khalti Sandbox checkout...', 'success');
        }

        // Redirect browser to payment page
        window.location.href = checkoutUrl;
      } else {
        addToast('Failed to initiate transaction with payment gateway', 'error');
        setProcessing(false);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      addToast(err.response?.data?.message || 'Error occurred during checkout process', 'error');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '80px', textAlign: 'center', opacity: 0.6 }}>
        <p>Fetching reservation detail matrices...</p>
      </div>
    );
  }

  const daysCount = vehicle?.pricing?.days || 1;

  return (
    <div className="container" style={{ marginTop: '40px' }}>
      
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>
          RESERVATION CHECKOUT
        </h1>
        <p style={{ opacity: 0.6, fontSize: '1rem', marginTop: '4px' }}>
          Confirm your pricing rate and rental location pickup.
        </p>
      </div>

      <div className="grid-cols-2" style={{ alignItems: 'flex-start' }}>
        
        {/* Left Side: Summary Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Selected Vehicle */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8 }}>
              <Car size={16} />
              <span>SELECTED ALLOCATION</span>
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <span className="badge" style={{ marginBottom: '8px' }}>{vehicle?.type}</span>
                <h4 style={{ fontSize: '1.4rem', textTransform: 'uppercase' }}>{vehicle?.brand} {vehicle?.name}</h4>
                <p style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '4px' }}>
                  Model year: {vehicle?.model} | Fuel Engine: {vehicle?.fuelType}
                </p>
                <div style={{ marginTop: '12px' }}>
                  <span className="badge" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                    NRS {vehicle?.rentPerDay}/day
                  </span>
                </div>
              </div>
              {vehicle?.image && (
                <div style={{ width: '150px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--badge-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', alignSelf: 'center' }}>
                  <img 
                    src={getImageUrl(vehicle.image)} 
                    alt={`${vehicle.brand} ${vehicle.name}`} 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Location details */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8 }}>
              <MapPin size={16} />
              <span>PICKUP STATION</span>
            </h3>
            <h4 style={{ fontSize: '1.2rem', textTransform: 'uppercase' }}>{location?.name}</h4>
            <p style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '4px' }}>
              GPS: Latitude {location?.latitude} | Longitude {location?.longitude}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '0.75rem', opacity: 0.5 }}>
              <Award size={12} />
              <span>Nearest branch selection.</span>
            </div>
          </div>

          {/* Date range details */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8 }}>
              <Calendar size={16} />
              <span>RENTAL TIMELINE</span>
            </h3>
            <div className="grid-cols-2">
              <div>
                <span style={{ fontSize: '0.75rem', opacity: 0.5, display: 'block', textTransform: 'uppercase' }}>PICKUP DATE</span>
                <strong style={{ fontSize: '0.95rem' }}>{formatDate(pickupDateStr)}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', opacity: 0.5, display: 'block', textTransform: 'uppercase' }}>RETURN DATE</span>
                <strong style={{ fontSize: '0.95rem' }}>{formatDate(returnDateStr)}</strong>
              </div>
            </div>
            <div style={{ borderTop: '1px dashed var(--border-color)', marginTop: '16px', paddingTop: '12px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>TOTAL DURATION: {daysCount} RENTAL DAYS</span>
            </div>
          </div>

        </div>

        {/* Right Side: Pricing Breakdown & Payment Button */}
        <div className="card" style={{ border: '2px solid var(--text-color)', backgroundColor: 'var(--badge-bg)' }}>
          <h3 style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <Calculator size={18} />
            <span>FARE BREAKDOWN MATRIX</span>
          </h3>

          {vehicle?.pricing && (
            <div style={{ display: 'flex', flexSpread: 'column', gap: '12px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ opacity: 0.7 }}>Base Rental Fee ({daysCount} days):</span>
                <span>NRS {vehicle.pricing.basePrice}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ opacity: 0.7 }}>Type Multiplier Adjustment ({vehicle.type}):</span>
                <span>x{vehicle.pricing.vehicleTypeMultiplier}</span>
              </div>

              {vehicle.pricing.breakdown.spansWeekend && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-color)' }}>
                  <span style={{ opacity: 0.7 }}>Weekend Rental Markup (+20%):</span>
                  <span>x1.2</span>
                </div>
              )}

              {vehicle.pricing.breakdown.spansPeak && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ opacity: 0.7 }}>Peak Season Rent Markup (+10%):</span>
                  <span>x1.1</span>
                </div>
              )}

              {vehicle.pricing.breakdown.isLongTerm && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ opacity: 0.7 }}>Long-Term Rental Discount (-15%):</span>
                  <span>-NRS {vehicle.pricing.longTermDiscount}</span>
                </div>
              )}

              <div style={{ borderBottom: '1px dashed var(--border-color)', margin: '16px 0' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <strong style={{ fontSize: '1.2rem', textTransform: 'uppercase' }}>Final Locked Price</strong>
                <strong style={{ fontSize: '1.8rem', letterSpacing: '-0.02em' }}>NRS {vehicle.pricing.finalPrice}</strong>
              </div>
            </div>
          )}

          {/* Secure details warning */}
          <div style={{ display: 'flex', gap: '12px', border: '1px solid var(--border-color)', padding: '16px', marginBottom: '24px', fontSize: '0.8rem', opacity: 0.8 }}>
            <ShieldAlert size={20} style={{ flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Double Booking Protection</p>
              <p>Continuing registers a booking draft in our database, verifying overlaps. Unpaid pending drafts automatically expire.</p>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            className="btn"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyCentert: 'center', gap: '10px' }}
            disabled={processing}
          >
            <CreditCard size={18} />
            <span>{processing ? 'Processing Session...' : 'PAY WITH KHALTI'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default BookingDetails;
