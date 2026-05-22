const axios = require('axios');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');

// @desc    Initiate Khalti Payment
// @route   POST /api/payments/initiate
// @access  Private
const initiatePayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Booking ID is required' });
    }

    // Fetch booking details
    const booking = await Booking.findById(bookingId).populate('vehicle').populate('user');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Khalti expects the amount in PAISA (1 NPR = 100 paisa)
    const amountInPaisa = Math.round(booking.totalPrice * 100);

    // Prepare Khalti request payload
    const khaltiPayload = {
      return_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment-callback`,
      website_url: process.env.CLIENT_URL || 'http://localhost:5173',
      amount: amountInPaisa,
      purchase_order_id: booking._id.toString(),
      purchase_order_name: `Vehicle Rental - Booking ${booking.bookingId}`,
      customer_info: {
        name: booking.user.name,
        email: booking.user.email,
      },
    };

    const khaltiSecret = process.env.KHALTI_SECRET_KEY;
    const isMock = !khaltiSecret || khaltiSecret.includes('placeholder');

    if (isMock) {
      // DEV SIMULATION MODE: If no real Khalti secret is configured, generate a simulated URL and pidx!
      console.log('--- KHALTI SIMULATION MODE ACTIVE ---');
      const simulatedPidx = `mock_pidx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const simulatedPaymentUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment-callback?pidx=${simulatedPidx}&transaction_id=mock_tx_${Date.now()}&amount=${amountInPaisa}&purchase_order_id=${booking._id}`;

      // Create a pending payment record
      await Payment.create({
        booking: booking._id,
        pidx: simulatedPidx,
        amount: booking.totalPrice,
        status: 'Pending',
      });

      return res.json({
        success: true,
        message: 'Simulation payment initiated successfully',
        data: {
          pidx: simulatedPidx,
          payment_url: simulatedPaymentUrl,
          isSimulated: true,
        },
      });
    }

    // REAL KHALTI SANDBOX INTEGRATION
    try {
      const response = await axios.post(
        'https://a.khalti.com/api/v2/epayment/initiate/',
        khaltiPayload,
        {
          headers: {
            Authorization: `Key ${khaltiSecret}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Create a pending payment record in DB
      await Payment.create({
        booking: booking._id,
        pidx: response.data.pidx,
        amount: booking.totalPrice,
        status: 'Pending',
      });

      res.json({
        success: true,
        message: 'Khalti payment initiated successfully',
        data: {
          pidx: response.data.pidx,
          payment_url: response.data.payment_url,
          isSimulated: false,
        },
      });
    } catch (apiError) {
      console.error('Khalti API Error Details:', apiError.response?.data || apiError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to initiate payment with Khalti API.',
        error: apiError.response?.data || apiError.message,
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Verify Payment Status (Lookup / Callback Verification)
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { pidx, transactionId } = req.body;

    if (!pidx) {
      return res.status(400).json({ success: false, message: 'pidx is required' });
    }

    // Find payment record
    const payment = await Payment.findOne({ pidx }).populate('booking');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found in system' });
    }

    const booking = await Booking.findById(payment.booking._id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Associated booking not found' });
    }

    // Check if payment is already processed
    if (payment.status === 'Completed') {
      return res.json({
        success: true,
        message: 'Payment has already been successfully verified.',
        data: { booking, payment },
      });
    }

    const khaltiSecret = process.env.KHALTI_SECRET_KEY;
    const isMock = !khaltiSecret || khaltiSecret.includes('placeholder') || pidx.startsWith('mock_');

    if (isMock) {
      // DEV SIMULATION MODE: Auto-confirm simulated payments!
      console.log('--- VERIFYING SIMULATED PAYMENT ---');
      
      // Update Payment status to Completed
      payment.status = 'Completed';
      payment.transactionId = transactionId || `mock_tx_${Date.now()}`;
      await payment.save();

      // Update Booking status to Confirmed
      booking.bookingStatus = 'Confirmed';
      await booking.save();

      // Mark the Vehicle status to rented
      const vehicle = await Vehicle.findById(booking.vehicle);
      if (vehicle) {
        vehicle.status = 'rented';
        await vehicle.save();
      }

      return res.json({
        success: true,
        message: 'Payment simulation verified and booking confirmed!',
        data: { booking, payment },
      });
    }

    // REAL KHALTI SANDBOX VERIFICATION LOOKUP
    try {
      const response = await axios.post(
        'https://a.khalti.com/api/v2/epayment/lookup/',
        { pidx },
        {
          headers: {
            Authorization: `Key ${khaltiSecret}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const khaltiStatus = response.data.status;

      if (khaltiStatus === 'Completed') {
        // Update Payment status in DB
        payment.status = 'Completed';
        payment.transactionId = response.data.transaction_id;
        await payment.save();

        // Update Booking status in DB
        booking.bookingStatus = 'Confirmed';
        await booking.save();

        // Update Vehicle status to rented
        const vehicle = await Vehicle.findById(booking.vehicle);
        if (vehicle) {
          vehicle.status = 'rented';
          await vehicle.save();
        }

        res.json({
          success: true,
          message: 'Payment successfully verified by Khalti and booking is confirmed!',
          data: { booking, payment },
        });
      } else {
        payment.status = khaltiStatus; // e.g. 'Failed', 'Refunded'
        await payment.save();

        res.status(400).json({
          success: false,
          message: `Payment verification failed. Khalti status: ${khaltiStatus}`,
          data: response.data,
        });
      }
    } catch (apiError) {
      console.error('Khalti Lookup API Error:', apiError.response?.data || apiError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify payment with Khalti API.',
        error: apiError.response?.data || apiError.message,
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  initiatePayment,
  verifyPayment,
};
