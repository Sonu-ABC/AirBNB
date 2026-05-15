const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync');
const { isLoggedIn } = require('../middleware');
const bookingController = require('../controllers/bookings');

// Show booking form
router.get('/listings/:id/book', isLoggedIn, wrapAsync(bookingController.renderBookingForm));

// Create Razorpay order (AJAX)
router.post('/listings/:id/book/create-order', isLoggedIn, wrapAsync(bookingController.createOrder));

// Verify payment & confirm booking
router.post('/listings/:id/book/verify-payment', isLoggedIn, wrapAsync(bookingController.verifyPayment));

// Booking success page
router.get('/bookings/:bookingId/success', isLoggedIn, wrapAsync(bookingController.showSuccess));

module.exports = router;
