const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users.js");

router.route("/signup")
   .get(userController.renderSignupForm)
   .post(wrapAsync(userController.signup));

// OTP verification routes
router.route("/verify-otp")
    .get(userController.renderVerifyOtpForm)
    .post(wrapAsync(userController.verifyOtp));

router.route("/login")
     .get(userController.renderLoginForm)
     .post(saveRedirectUrl, passport.authenticate("local",
    {
        failureRedirect: "/login",
        failureFlash: true
    }),
    userController.login
);

router.get("/logout", userController.logout);

module.exports = router;
