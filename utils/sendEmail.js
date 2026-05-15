const nodemailer = require("nodemailer");

// Using Brevo (Sendinblue) SMTP — works reliably on Render free tier
// Gmail SMTP is blocked on Render due to IPv6/firewall restrictions
const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",  // Brevo's IPv4-only SMTP relay
    port: 587,
    secure: false,                  // STARTTLS
    auth: {
        user: process.env.BREVO_USER, // your Brevo account email
        pass: process.env.BREVO_PASS, // your Brevo SMTP key (xsmtpsib-...)
    },
});

module.exports.sendOtpEmail = async (toEmail, otp) => {
    const mailOptions = {
        from: `"WonderLust 🏡" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: "Your OTP for WonderLust Registration",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #fe424d; text-align: center;">WonderLust 🏡</h2>
                <h3 style="text-align: center;">Email Verification</h3>
                <p>Hi there! Thank you for signing up on <strong>WonderLust</strong>.</p>
                <p>Please use the OTP below to verify your email address. It is valid for <strong>10 minutes</strong>.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #fe424d; background: #f5f5f5; padding: 15px 30px; border-radius: 8px;">
                        ${otp}
                    </span>
                </div>
                <p style="color: #888; font-size: 13px;">If you didn't request this, please ignore this email.</p>
                <hr/>
                <p style="text-align: center; color: #aaa; font-size: 12px;">© 2025 WonderLust. All rights reserved.</p>
            </div>
        `,
    };
    await transporter.sendMail(mailOptions);
};

module.exports.sendBookingConfirmationEmail = async (toEmail, username, booking) => {
    const checkInDate = new Date(booking.checkIn).toLocaleDateString("en-IN", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    const checkOutDate = new Date(
        new Date(booking.checkIn).getTime() + booking.days * 24 * 60 * 60 * 1000
    ).toLocaleDateString("en-IN", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const mailOptions = {
        from: `"WonderLust 🏡" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `Booking Confirmed! Your trip to ${booking.listing.location} 🎉`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 0; border-radius: 12px; overflow: hidden; border: 1px solid #eee;">
                <!-- Header -->
                <div style="background: #fe424d; padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">WonderLust 🏡</h1>
                    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Your booking is confirmed!</p>
                </div>
                <!-- Body -->
                <div style="padding: 30px; background: #fff;">
                    <h2 style="color: #222;">Hey ${username}, welcome to ${booking.listing.location}! 🌍</h2>
                    <p style="color: #555; line-height: 1.6;">
                        We're so excited to have you! Your stay at <strong>${booking.listing.title}</strong> 
                        has been successfully booked. Pack your bags and get ready for an amazing trip!
                    </p>
                    <!-- Booking Details Card -->
                    <div style="background: #f9f9f9; border-radius: 10px; padding: 20px; margin: 24px 0;">
                        <h3 style="margin: 0 0 16px; color: #fe424d;">📋 Booking Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #888; font-size: 14px;">Destination</td>
                                <td style="padding: 8px 0; font-weight: 600; color: #222;">${booking.listing.location}, ${booking.listing.country}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #888; font-size: 14px;">Property</td>
                                <td style="padding: 8px 0; font-weight: 600; color: #222;">${booking.listing.title}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #888; font-size: 14px;">Check-in</td>
                                <td style="padding: 8px 0; font-weight: 600; color: #222;">${checkInDate}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #888; font-size: 14px;">Check-out</td>
                                <td style="padding: 8px 0; font-weight: 600; color: #222;">${checkOutDate}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #888; font-size: 14px;">Duration</td>
                                <td style="padding: 8px 0; font-weight: 600; color: #222;">${booking.days} Night${booking.days > 1 ? 's' : ''}</td>
                            </tr>
                            <tr style="border-top: 1px solid #eee;">
                                <td style="padding: 12px 0 4px; color: #888; font-size: 14px;">Total Paid</td>
                                <td style="padding: 12px 0 4px; font-weight: 700; color: #fe424d; font-size: 18px;">₹${booking.totalPrice.toLocaleString('en-IN')}</td>
                            </tr>
                        </table>
                    </div>
                    <p style="color: #555; line-height: 1.6;">
                        If you have any questions, feel free to contact us. We wish you a wonderful stay! 🌟
                    </p>
                </div>
                <!-- Footer -->
                <div style="background: #f5f5f5; padding: 20px; text-align: center;">
                    <p style="color: #aaa; font-size: 12px; margin: 0;">© 2025 WonderLust. All rights reserved.</p>
                    <p style="color: #aaa; font-size: 12px; margin: 4px 0 0;">Payment ID: ${booking.razorpayPaymentId}</p>
                </div>
            </div>
        `,
    };
    await transporter.sendMail(mailOptions);
};

