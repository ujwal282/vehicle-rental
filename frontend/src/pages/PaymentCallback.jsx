import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { CheckCircle2, XCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const pidx = searchParams.get('pidx');
  const transactionId = searchParams.get('transaction_id');
  const purchaseOrderId = searchParams.get('purchase_order_id');

  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [bookingDetails, setBookingDetails] = useState(null);

  // Prevent duplicate verification calls in React StrictMode
  const verifiedRef = useRef(false);

  useEffect(() => {
    const verifyPaymentTransaction = async () => {
      if (verifiedRef.current) return;
      verifiedRef.current = true;

      if (!pidx) {
        setStatus('error');
        setErrorMsg('Invalid callback parameters. No transaction index (pidx) detected.');
        addToast('Invalid payment callback', 'error');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const res = await axios.post(
          `${API_URL}/api/payments/verify`,
          { pidx, transactionId },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (res.data.success) {
          setStatus('success');
          setBookingDetails(res.data.data.booking);
          addToast('Payment verified successfully!', 'success');
        } else {
          setStatus('error');
          setErrorMsg(res.data.message || 'Payment transaction verification failed.');
          addToast('Payment failed', 'error');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
        setErrorMsg(err.response?.data?.message || 'Failed to complete transaction verification.');
        addToast('Verification failed', 'error');
      }
    };

    verifyPaymentTransaction();
  }, [pidx, transactionId, addToast]);

  return (
    <div className="container" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '550px', textAlign: 'center', padding: '40px' }}>
        
        {status === 'verifying' && (
          <div>
            <Loader2 size={48} className="spin-icon" style={{ margin: '0 auto 24px auto', strokeWidth: 1.5 }} />
            <h2 style={{ fontSize: '1.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>
              VERIFYING TRANSACTION
            </h2>
            <p style={{ opacity: 0.6, fontSize: '0.95rem' }}>
              Confirming transaction status with the payment gateway router. Please do not close or reload this browser tab.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <CheckCircle2 size={56} style={{ color: 'var(--text-color)', margin: '0 auto 24px auto', strokeWidth: 1.5 }} />
            <h2 style={{ fontSize: '1.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>
              RESERVATION SECURED
            </h2>
            <p style={{ opacity: 0.6, fontSize: '0.95rem', marginBottom: '24px' }}>
              Your payment has been successfully verified, booking is confirmed, and your allocated vehicle is registered.
            </p>

            <div className="card" style={{ textAlign: 'left', backgroundColor: 'var(--badge-bg)', marginBottom: '32px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ opacity: 0.7 }}>Booking Reference ID:</span>
                <strong>{bookingDetails?.bookingId || 'VR-XXXXXX'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ opacity: 0.7 }}>Transaction ID:</span>
                <span style={{ fontFamily: 'monospace' }}>{transactionId || 'MOCK_TX_ID'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ opacity: 0.7 }}>Pricing Paid:</span>
                <strong>NRS {bookingDetails?.totalPrice || '0.00'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', marginTop: '12px', paddingTop: '12px' }}>
                <span style={{ opacity: 0.7 }}>Booking status:</span>
                <span className="badge" style={{ backgroundColor: 'var(--text-color)', color: 'var(--bg-color)', border: 'none' }}>CONFIRMED</span>
              </div>
            </div>

            <div className="grid-cols-2">
              <Link to="/history" className="btn" style={{ width: '100%' }}>
                <span>Booking History</span>
                <ArrowRight size={14} />
              </Link>
              <Link to="/" className="btn btn-secondary" style={{ width: '100%' }}>
                Browse Fleet
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div>
            <XCircle size={56} style={{ color: 'var(--text-color)', margin: '0 auto 24px auto', strokeWidth: 1.5 }} />
            <h2 style={{ fontSize: '1.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>
              TRANSACTION FAILED
            </h2>
            <p style={{ opacity: 0.6, fontSize: '0.95rem', marginBottom: '24px' }}>
              {errorMsg}
            </p>

            <div className="grid-cols-2">
              <Link to="/" className="btn" style={{ width: '100%' }}>
                Try Checkout Again
              </Link>
              <Link to="/history" className="btn btn-secondary" style={{ width: '100%' }}>
                View Bookings
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentCallback;
