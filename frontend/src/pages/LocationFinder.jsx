import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MapPin, Navigation, ArrowRight, Route } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LocationFinder = () => {
  const { user, updateUserLocation } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const rentVehicleId = searchParams.get('rentVehicleId');
  const pickupDate = searchParams.get('pickupDate');
  const returnDate = searchParams.get('returnDate');

  const [lat, setLat] = useState(user?.latitude || '27.6850');
  const [lng, setLng] = useState(user?.longitude || '85.3200');

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const calculateNearestBranches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/locations?lat=${lat}&lng=${lng}`);
      if (res.data.success) {
        setBranches(res.data.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load branch locations', 'error');
    } finally {
      setLoading(false);
    }
  }, [lat, lng, addToast]);

  useEffect(() => {
    calculateNearestBranches();
  }, [calculateNearestBranches]);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setCalculating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const browserLat = position.coords.latitude.toFixed(6);
          const browserLng = position.coords.longitude.toFixed(6);
          setLat(browserLat);
          setLng(browserLng);
          await updateUserLocation(browserLat, browserLng);
          addToast('GPS coordinates updated from browser!', 'success');
          setCalculating(false);
        },
        () => {
          addToast('Could not fetch browser GPS location.', 'error');
          setCalculating(false);
        }
      );
    } else {
      addToast('Geolocation not supported by browser', 'error');
    }
  };

  const handleSelectBranch = (branchId) => {
    if (!rentVehicleId || !pickupDate || !returnDate) {
      addToast('Please go back to Home and select a vehicle & dates first', 'error');
      navigate('/');
      return;
    }
    navigate(`/booking-checkout?vehicleId=${rentVehicleId}&pickupLocationId=${branchId}&pickupDate=${pickupDate}&returnDate=${returnDate}`);
  };

  return (
    <div className="container" style={{ marginTop: '40px' }}>

      {/* Page Header */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '24px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>
          Select Pickup Location
        </h1>
        <p style={{ opacity: 0.6, fontSize: '1rem', marginTop: '4px' }}>
          Enter your coordinates to find the nearest branch, or use your browser's GPS.
        </p>
      </div>

      {/* Coordinate Input */}
      <div className="card" style={{ marginBottom: '40px' }}>
        <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Navigation size={16} />
          <span>YOUR LOCATION</span>
        </h3>

        <div className="grid-cols-3">
          <div>
            <label>Latitude</label>
            <input
              type="number"
              step="0.000001"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
          </div>

          <div>
            <label>Longitude</label>
            <input
              type="number"
              step="0.000001"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'flex-end', paddingBottom: '20px' }}>
            <button onClick={calculateNearestBranches} className="btn" style={{ width: '100%' }}>
              Find Nearest Branch
            </button>
            <button onClick={handleGetCurrentLocation} className="btn btn-secondary" style={{ width: '100%', fontSize: '0.75rem', padding: '8px' }}>
              {calculating ? 'Syncing...' : 'Fetch GPS from browser'}
            </button>
          </div>
        </div>
      </div>

      {/* Branch List Header */}
      <h2 style={{ fontSize: '1.6rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Route size={20} />
        <span>NEARBY BRANCHES ({branches.length})</span>
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.6 }}>
          <p>Locating nearest branches...</p>
        </div>
      ) : branches.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
          <p>No branches are configured in the system.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {branches.map((branch, index) => {
            const isClosest = index === 0;

            return (
              <div
                key={branch._id}
                className="card"
                style={{
                  border: isClosest ? '2px solid var(--text-color)' : '1px solid var(--border-color)',
                  backgroundColor: isClosest ? 'var(--badge-bg)' : 'var(--card-bg)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '20px',
                  padding: '24px',
                }}
              >
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <MapPin size={18} />
                    <h3 style={{ fontSize: '1.3rem', textTransform: 'uppercase' }}>
                      {branch.name}
                    </h3>
                    {isClosest && (
                      <span className="badge" style={{ backgroundColor: 'var(--text-color)', color: 'var(--bg-color)', border: 'none' }}>
                        Nearest
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '16px' }}>
                    {branch.latitude}, {branch.longitude}
                  </p>

                  {/* Route path nodes */}
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '0.8rem' }}>
                    {branch.routingPath.map((nodeName, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && <span style={{ opacity: 0.4 }}>&rarr;</span>}
                        <span
                          style={{
                            padding: '4px 8px',
                            border: '1px solid var(--border-color)',
                            fontWeight: nodeName === branch.name ? 'bold' : 'normal',
                          }}
                        >
                          {nodeName}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block' }}>DISTANCE</span>
                    <strong style={{ fontSize: '1.4rem' }}>{branch.distanceFromUser} km</strong>
                    <span style={{ fontSize: '0.7rem', opacity: 0.4, display: 'block' }}>Direct: {branch.directDistance} km</span>
                  </div>

                  <button
                    onClick={() => handleSelectBranch(branch._id)}
                    className="btn"
                    style={{ fontSize: '0.8rem', padding: '10px 20px' }}
                  >
                    <span>{rentVehicleId ? 'Confirm Branch' : 'Select Branch'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LocationFinder;
