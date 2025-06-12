const User = require("../models/user");



module.exports.renderSignupForm =(req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signup=async (req, res) => {
    try{
    const { username, email, password } = req.body;
    const newUser = new User({ email,username});
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.login(registeredUser, (err) => {
        if (err) {
            return next(err);
        }
    // req.flash("success", `Welcome to WonderLust, ${registeredUser.username}!`);
    req.flash("success", "Welcome to WonderLust!");
    res.redirect("/listings");
    });
  
    }catch(e){
        req.flash("error", e.message);
        res.redirect("/signup");
    }

};

module.exports.renderLoginForm =  (req, res) => {
    res.render("users/login.ejs");
};

module.exports.login  = async (req, res) => {
        req.flash("success", "Welcome Back to WonderLust! You are logged in");
        const redirectUrl = res.locals.redirectUrl || "/listings"; // fallback to /listings
        res.redirect(redirectUrl);
        
    };

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You have successfully logged out!");
        res.redirect("/listings");
    });
};

