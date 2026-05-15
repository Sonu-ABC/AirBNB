const User = require("../models/user");
const { sendOtpEmail } = require("../utils/sendEmail");

// Helper: generate a 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);

        // Generate OTP and save to user
        const otp = generateOtp();
        registeredUser.otp = otp;
        registeredUser.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        registeredUser.isVerified = false;
        await registeredUser.save();

        // ✅ Save session BEFORE sending email so session is always set
        req.session.otpUserId = registeredUser._id;

        // Try to send OTP email — non-fatal if it fails (e.g. on Render SMTP is blocked)
        let emailSent = false;
        try {
            await sendOtpEmail(email, otp);
            emailSent = true;
        } catch (emailErr) {
            console.error("OTP email failed:", emailErr.message);
        }

        if (emailSent) {
            req.flash("success", "A 6-digit OTP has been sent to your email. Please verify to continue.");
            return res.redirect("/verify-otp");
        } else {
            // Email could not be sent — auto-verify the user and log them in directly
            registeredUser.isVerified = true;
            registeredUser.otp = undefined;
            registeredUser.otpExpiry = undefined;
            await registeredUser.save();
            delete req.session.otpUserId;

            req.login(registeredUser, (err) => {
                if (err) return next(err);
                req.flash("success", `Welcome to WonderLust, ${username}! 🎉`);
                res.redirect("/listings");
            });
        }

    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

module.exports.renderVerifyOtpForm = (req, res) => {
    if (!req.session.otpUserId) {
        req.flash("error", "Session expired. Please sign up again.");
        return res.redirect("/signup");
    }
    res.render("users/verify-otp.ejs");
};

module.exports.verifyOtp = async (req, res, next) => {
    try {
        const { otp } = req.body;
        const userId = req.session.otpUserId;

        if (!userId) {
            req.flash("error", "Session expired. Please sign up again.");
            return res.redirect("/signup");
        }

        const user = await User.findById(userId);
        if (!user) {
            req.flash("error", "User not found. Please sign up again.");
            return res.redirect("/signup");
        }

        // Check if OTP is expired
        if (Date.now() > user.otpExpiry) {
            req.flash("error", "OTP has expired. Please sign up again.");
            await User.findByIdAndDelete(userId); // remove unverified user
            delete req.session.otpUserId;
            return res.redirect("/signup");
        }

        // Check if OTP matches
        if (user.otp !== otp.trim()) {
            req.flash("error", "Invalid OTP. Please try again.");
            return res.redirect("/verify-otp");
        }

        // Mark user as verified and clear OTP fields
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        // Clear session OTP key
        delete req.session.otpUserId;

        // Log the user in
        req.login(user, (err) => {
            if (err) return next(err);
            req.flash("success", "Email verified! Welcome to WonderLust 🎉");
            res.redirect("/listings");
        });

    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/verify-otp");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
    req.flash("success", "Welcome Back to WonderLust! You are logged in");
    const redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "You have successfully logged out!");
        res.redirect("/listings");
    });
};
