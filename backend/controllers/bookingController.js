const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const { calculatePricing } = require('../services/pricingService');

// @desc    Create a new booking (draft / pending payment)
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    const { vehicleId, pickupLocationId, pickupDate, returnDate } = req.body;
    const userId = req.user._id;

    if (!vehicleId || !pickupLocationId || !pickupDate || !returnDate) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);

    // Validate dates
    if (pickup < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({ success: false, message: 'Pickup date cannot be in the past' });
    }

    if (pickup >= returnD) {
      return res.status(400).json({ success: false, message: 'Return date must be after pickup date' });
    }

    // Fetch vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    if (vehicle.status === 'maintenance') {
      return res.status(400).json({ success: false, message: 'Vehicle is currently undergoing maintenance' });
    }

    // Prevent double booking!
    // Check if there is any overlapping confirmed booking for this vehicle
    const overlappingBooking = await Booking.findOne({
      vehicle: vehicleId,
      bookingStatus: 'Confirmed',
      pickupDate: { $lte: returnD },
      returnDate: { $gte: pickup },
    });

    if (overlappingBooking) {
      return res.status(400).json({
        success: false,
        message: 'This vehicle is already booked for the selected dates. Please choose another vehicle or date range.',
      });
    }

    // Calculate dynamic pricing strictly on the backend (Greedy Algorithm Rules)
    const pricingDetails = calculatePricing(vehicle, pickupDate, returnDate);

    // Create the booking draft (Pending status)
    const booking = await Booking.create({
      user: userId,
      vehicle: vehicleId,
      pickupLocation: pickupLocationId,
      pickupDate: pickup,
      returnDate: returnD,
      totalPrice: pricingDetails.finalPrice,
      bookingStatus: 'Pending',
    });

    res.status(201).json({
      success: true,
      message: 'Booking draft created successfully. Proceed to payment.',
      data: {
        booking,
        pricingDetails,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get booking history for the current user or all bookings for admin
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res) => {
  try {
    let query = {};

    // If user is not admin, only show their bookings
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email')
      .populate('vehicle')
      .populate('pickupLocation')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('vehicle')
      .populate('pickupLocation');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Ensure the booking belongs to the current user (unless admin)
    if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Cancel booking (only allowed BEFORE the pickup date)
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('vehicle');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Authorization check
    if (req.user.role !== 'admin' && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    if (booking.bookingStatus === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    if (booking.bookingStatus === 'Completed') {
      return res.status(400).json({ success: false, message: 'Completed bookings cannot be cancelled' });
    }

    // Crucial rule: Check if current date is before pickup date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pickup = new Date(booking.pickupDate);
    pickup.setHours(0, 0, 0, 0);

    if (today >= pickup) {
      return res.status(400).json({
        success: false,
        message: 'Bookings can only be cancelled before the scheduled pickup date.',
      });
    }

    // Perform cancellation
    booking.bookingStatus = 'Cancelled';
    await booking.save();

    // If the vehicle was marked as rented for this booking, release it back to available
    // (Only if it's currently marked as rented)
    const vehicle = await Vehicle.findById(booking.vehicle._id);
    if (vehicle && vehicle.status === 'rented') {
      vehicle.status = 'available';
      await vehicle.save();
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully. Refund processing if paid.',
      data: booking,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  cancelBooking,
};
