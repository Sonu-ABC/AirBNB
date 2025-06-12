if(process.env.NODE_ENV !== 'production') {

require('dotenv').config();
}

const express = require('express');
const app=express();
const mongoose = require('mongoose');
const Listing = require('./models/listing.js');
const path = require('path');
const ejsMate = require('ejs-mate');
const wrapAsync = require("./utils/wrapAsync.js");
const  ExpressError= require("./utils/ExpressError");
const {listingSchema, reviewSchema} = require("./schema.js");
const Review = require('./models/review.js');
const methodOverride = require('method-override');
const { listenerCount } = require('process');
app.use(methodOverride('_method'));
const session = require('express-session');
const MongoStore = require('connect-mongo');

const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user.js');

const listingRouter= require('./routes/listing.js');
const reviewRouter  = require('./routes/review.js');
const userRouter = require('./routes/user.js');
const dbUrl = process.env.ATLASDB_URL;

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 3600, // time in seconds
    crypto: {
        secret: process.env.SECRET , // secret for encrypting session data
    },
});


store.on("error",()=>{
    console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
    store,
    secret:  process.env.SECRET ,
    resave: false,
    saveUninitialized: true,
    cookie:{
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 day
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 day
    },
};



//const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.static(path.join(__dirname,"public")));
app.use(express.urlencoded({extended:true}));
app.engine('ejs', ejsMate);
main()
   .then(() => {
         console.log("MongoDB Connected");
   })
    .catch((err) => {
        console.log("MongoDB Connection Failed");
        console.log(err);
    });


async function main(){
    await mongoose.connect(dbUrl);
}


app.use(session(sessionOptions));
app.use(flash());

// Passport Configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
   // Make currentUser available in all templates
    next();
});

/*app.get("/demouser", async (req, res) => {
    let fakeUser = new User({ 
        email: "student@gmail.com",
        username: "delta-student"
    });
   let registeredUser= await  User.register(fakeUser, "helloworld");
   res.send(registeredUser);
});*/

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/", userRouter);

app.use((err,req,res,next)=>{
    let {statusCode=500,message="Something went wrong!"}=err;
    res.status(statusCode).render("error.ejs",{err});
});

app.listen(8080, () => {
    console.log("Server is running on port 8080");
});