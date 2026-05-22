import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Search, Flame, CircleDollarSign, Zap, HelpCircle, ArrowRight, Compass, ShieldCheck } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${API_URL}/${cleanPath}`;
};

const Home = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  
  // Date states for Dynamic Pricing
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  
  // Recommendation states
  const [recommendation, setRecommendation] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Fetch all vehicles with filters
  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/vehicles?`;
      if (searchTerm) url += `search=${searchTerm}&`;
      if (selectedType) url += `type=${selectedType}&`;
      if (pickupDate && returnDate) {
        url += `pickupDate=${pickupDate}&returnDate=${returnDate}&`;
      }

      const res = await axios.get(url);
      if (res.data.success) {
        setVehicles(res.data.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to retrieve vehicles', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedType, pickupDate, returnDate, addToast]);

  // Fetch Optimal Recommendation
  const fetchRecommendation = useCallback(async () => {
    setRecLoading(true);
    try {
      let url = `${API_URL}/api/vehicles/recommend/optimal?`;
      if (selectedType) url += `type=${selectedType}&`;
      if (pickupDate && returnDate) {
        url += `pickupDate=${pickupDate}&returnDate=${returnDate}&`;
      }

      const res = await axios.get(url);
      if (res.data.success && res.data.data) {
        setRecommendation(res.data.data.recommendation);
        setAlternatives(res.data.data.alternatives || []);
      } else {
        setRecommendation(null);
        setAlternatives([]);
      }
    } catch (err) {
      console.error(err);
      setRecommendation(null);
      setAlternatives([]);
    } finally {
      setRecLoading(false);
    }
  }, [selectedType, pickupDate, returnDate]);

  useEffect(() => {
    fetchVehicles();
    fetchRecommendation();
  }, [fetchVehicles, fetchRecommendation]);

  // Handle immediate Rent button click
  const handleRentClick = (vehicleId) => {
    if (!user) {
      addToast('Please login to place a booking reservation', 'error');
      navigate('/login');
      return;
    }

    if (!pickupDate || !returnDate) {
      addToast('Please select Pickup and Return dates to calculate routing and price', 'error');
      // Scroll to date selection
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return;
    }

    // Redirect to nearest branch finder passing booking parameters
    navigate(`/locations?rentVehicleId=${vehicleId}&pickupDate=${pickupDate}&returnDate=${returnDate}`);
  };

  // Reset dates
  const handleClearDates = () => {
    setPickupDate('');
    setReturnDate('');
    addToast('Date selection cleared', 'success');
  };

  return (
    <div className="container" style={{ marginTop: '40px' }}>
      
      {/* Intro Hero banner */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '32px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, letterSpacing: '-0.05em', textTransform: 'uppercase' }}>
          VEHICLE.RENT
        </h1>
        <p style={{ opacity: 0.6, fontSize: '1.1rem', maxWidth: '600px', marginTop: '8px' }}>
          Rent standard, electric, and utility vehicles from nearby outlets.
        </p>
      </div>

      {/* Date Search & Filters Panel */}
      <div className="card" style={{ marginBottom: '40px', padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Compass size={16} />
          <span>RENTAL TIMELINE & SEARCH FILTER</span>
        </h3>
        
        <div className="grid-cols-3">
          <div>
            <label>Pickup Date</label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
            />
          </div>
          
          <div>
            <label>Return Date</label>
            <input
              type="date"
              min={pickupDate || new Date().toISOString().split('T')[0]}
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingBottom: '20px' }}>
            {pickupDate && returnDate ? (
              <button onClick={handleClearDates} className="btn btn-secondary" style={{ width: '100%' }}>
                Clear Selected Dates
              </button>
            ) : (
              <span style={{ fontSize: '0.75rem', opacity: 0.5, fontStyle: 'italic', marginBottom: '12px' }}>
                * Specify dates to compute total pricing breakdowns and verify double booking.
              </span>
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px dashed var(--border-color)', marginTop: '16px', paddingTop: '20px' }} className="grid-cols-2">
          <div>
            <label>Search Vehicles</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by brand or model name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '40px', marginBottom: '0' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '15px', opacity: 0.5 }} />
            </div>
          </div>

          <div>
            <label>Filter by Class Type</label>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={{ marginBottom: '0' }}>
              <option value="">All Vehicles</option>
              <option value="Bike">Bikes (0.5x multiplier)</option>
              <option value="Car">Standard Cars (1.0x multiplier)</option>
              <option value="EV">Electric Vehicles (1.2x multiplier)</option>
              <option value="SUV">Sports Utility Vehicles (1.5x multiplier)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recommended Recommendation Dashboard */}
      {recommendation && (
        <div style={{ border: '2px solid var(--text-color)', padding: '24px', marginBottom: '40px', backgroundColor: 'var(--badge-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--text-color)', color: 'var(--bg-color)', border: 'none' }}>
                <Flame size={12} fill="currentColor" />
                <span>RECOMMENDED VEHICLE</span>
              </span>
              <h2 style={{ fontSize: '1.8rem', marginTop: '6px', textTransform: 'uppercase' }}>
                BEST VALUE OPTION
              </h2>
            </div>
            {pickupDate && returnDate && (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>OPTIMIZED RATE ESTIMATE</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 700 }}>
                  NRS {recommendation.rentPerDay * (Math.ceil(Math.abs(new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24)) || 1)}*
                </h3>
              </div>
            )}
          </div>

          <div className="grid-cols-2">
            <div>
              <p style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase' }}>
                {recommendation.brand} &bull; {recommendation.name}
              </p>
              <p style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '4px' }}>
                Model Class: {recommendation.type} | Engine / Fuel: {recommendation.fuelType}
              </p>

              {recommendation.image && (
                <div style={{ width: '100%', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '16px 0', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <img 
                    src={getImageUrl(recommendation.image)} 
                    alt={`${recommendation.brand} ${recommendation.name}`} 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }}
                  />
                </div>
              )}
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
                <span className="badge">Daily Rate: NRS {recommendation.rentPerDay}</span>
                <span className="badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={10} />
                  <span>Fuel Efficiency: {recommendation.fuelEfficiency} KM/L</span>
                </span>
                <span className="badge">Status: {recommendation.status}</span>
              </div>

              <div style={{ marginTop: '24px' }}>
                <button onClick={() => handleRentClick(recommendation._id)} className="btn" style={{ width: '100%' }}>
                  <span>Reserve Recommended Vehicle</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div style={{ borderLeft: '1px dashed var(--border-color)', paddingLeft: '24px' }}>
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.8, marginBottom: '12px' }}>
                Vehicle Details
              </h4>
              <ul style={{ fontSize: '0.85rem', opacity: 0.7, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Daily Rent</strong>: NRS {recommendation.rentPerDay}/day, the lowest in this class.</li>
                <li><strong>Efficiency</strong>: {recommendation.fuelEfficiency} KM/L.</li>
                <li>Checked against calendar constraints for availability.</li>
              </ul>

              {alternatives.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '8px' }}>
                    Alternative Options
                  </h5>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {alternatives.map((alt) => (
                      <div key={alt._id} onClick={() => { setSearchTerm(alt.name); fetchVehicles(); }} style={{ flex: 1, border: '1px solid var(--border-color)', padding: '8px', cursor: 'pointer', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600 }}>{alt.brand} {alt.name}</p>
                        <p style={{ fontSize: '0.7rem', opacity: 0.5 }}>NRS {alt.rentPerDay}/d</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Vehicle Fleet */}
      <h2 style={{ fontSize: '1.8rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '24px' }}>
        FLEET AVAILABILITY ({vehicles.length})
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.6 }}>
          <p>Scanning rental databases...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
          <HelpCircle size={32} style={{ margin: '0 auto 12px auto' }} />
          <p>No matching vehicles found. Try adjusting search queries or date filters.</p>
        </div>
      ) : (
        <div className="grid-cols-3">
          {vehicles.map((vehicle) => {
            const daysCount = (pickupDate && returnDate) 
              ? Math.max(1, Math.ceil(Math.abs(new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24)))
              : 0;

            const finalPrice = vehicle.pricing?.finalPrice || (vehicle.rentPerDay * (daysCount || 1));

            return (
              <div key={vehicle._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span className="badge">{vehicle.type}</span>
                    <span className={`badge ${vehicle.status === 'available' ? '' : 'badge-disabled'}`} style={{ borderStyle: vehicle.status === 'available' ? 'solid' : 'dashed' }}>
                      {vehicle.status}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {vehicle.brand} {vehicle.name}
                  </h3>
                  <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '16px' }}>
                    Model: {vehicle.model} | Fuel: {vehicle.fuelType}
                  </p>

                  {vehicle.image && (
                    <div style={{ width: '100%', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', backgroundColor: 'var(--badge-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                      <img 
                        src={getImageUrl(vehicle.image)} 
                        alt={`${vehicle.brand} ${vehicle.name}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }}
                      />
                    </div>
                  )}

                  <div style={{ borderBottom: '1px dashed var(--border-color)', margin: '12px 0' }}></div>

                  {/* Dynamic pricing calculation breakdown */}
                  {vehicle.pricing ? (
                    <div style={{ backgroundColor: 'var(--badge-bg)', padding: '12px', fontSize: '0.75rem', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                      <span style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                        PRICING BREAKDOWN:
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Base ({daysCount} days x {vehicle.rentPerDay}):</span>
                          <span>NRS {vehicle.pricing.basePrice}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Class multiplier ({vehicle.type}):</span>
                          <span>x{vehicle.pricing.vehicleTypeMultiplier}</span>
                        </div>
                        {vehicle.pricing.breakdown.spansWeekend && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Weekend Markup (+20%):</span>
                            <span>x1.2</span>
                          </div>
                        )}
                        {vehicle.pricing.breakdown.spansPeak && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Peak Season Markup (+10%):</span>
                            <span>x1.1</span>
                          </div>
                        )}
                        {vehicle.pricing.breakdown.isLongTerm && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Long Term Discount (-15%):</span>
                            <span>-NRS {vehicle.pricing.longTermDiscount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '16px', opacity: 0.8 }}>
                      <span>Daily Rate:</span>
                      <strong>NRS {vehicle.rentPerDay}</strong>
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>TOTAL ESTIMATE</span>
                    <strong style={{ fontSize: '1.2rem' }}>NRS {finalPrice}</strong>
                  </div>

                  <button
                    onClick={() => handleRentClick(vehicle._id)}
                    className="btn"
                    style={{ width: '100%', fontSize: '0.8rem' }}
                    disabled={vehicle.status !== 'available'}
                  >
                    {vehicle.status === 'available' ? 'Rent Vehicle' : 'Unavailable'}
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

export default Home;
