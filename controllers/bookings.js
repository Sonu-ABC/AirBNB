const Listing = require('../models/listing');
const Booking = require('../models/booking');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendBookingConfirmationEmail } = require('../utils/sendEmail');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// GET /listings/:id/book  — show booking form
module.exports.renderBookingForm = async (req, res) => {
    const listing = await Listing.findById(req.params.id).populate('owner');
    if (!listing) {
        req.flash('error', 'Listing not found!');
        return res.redirect('/listings');
    }
    // Owners cannot book their own listing
    if (listing.owner._id.equals(req.user._id)) {
        req.flash('error', 'You cannot book your own listing!');
        return res.redirect(`/listings/${listing._id}`);
    }
    res.render('bookings/book.ejs', { listing });
};

// POST /listings/:id/book/create-order  — create Razorpay order
module.exports.createOrder = async (req, res) => {
    const { days, checkIn } = req.body;
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
    }

    const totalPrice = listing.price * parseInt(days);
    // Razorpay amount is in paise (1 INR = 100 paise)
    const amountInPaise = totalPrice * 100;

    const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {
            listingId: listing._id.toString(),
            userId: req.user._id.toString(),
            checkIn,
            days,
        },
    };

    const order = await razorpay.orders.create(options);

    // Save a pending booking record
    const booking = new Booking({
        listing: listing._id,
        user: req.user._id,
        checkIn: new Date(checkIn),
        days: parseInt(days),
        totalPrice,
        razorpayOrderId: order.id,
        paymentStatus: 'pending',
    });
    await booking.save();

    res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
        bookingId: booking._id,
        userName: req.user.username,
        userEmail: req.user.email,
    });
};

// POST /listings/:id/book/verify-payment  — verify & confirm booking
module.exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    // HMAC-SHA256 signature verification
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Payment verification failed.' });
    }

    // Update booking to paid
    const booking = await Booking.findByIdAndUpdate(
        bookingId,
        {
            razorpayPaymentId: razorpay_payment_id,
            paymentStatus: 'paid',
        },
        { new: true }
    ).populate('listing');

    // Send confirmation email (non-blocking)
    try {
        await sendBookingConfirmationEmail(req.user.email, req.user.username, booking);
    } catch (emailErr) {
        console.error('Booking confirmation email failed:', emailErr.message);
    }

    // Return redirect URL as JSON (fetch() can't follow server redirects)
    res.json({ redirect: `/bookings/${booking._id}/success` });
};

// GET /bookings/:bookingId/success  — show success page
module.exports.showSuccess = async (req, res) => {
    const booking = await Booking.findById(req.params.bookingId)
        .populate('listing')
        .populate('user');

    if (!booking || !booking.user._id.equals(req.user._id)) {
        req.flash('error', 'Booking not found!');
        return res.redirect('/listings');
    }
    res.render('bookings/success.ejs', { booking });
};
