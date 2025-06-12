const express = require("express");
const router= express.Router({mergeParams: true});

const wrapAsync = require("../utils/wrapAsync.js");
const  ExpressError= require("../utils/ExpressError");
const Review = require('../models/review.js');
const Listing = require('../models/listing.js');
const {validateReview, isLoggedIn,isReviewAuthor} = require("../middleware.js");
const reviewsController = require("../controllers/reviews.js");

//post review route
// This route allows users to post a review for a specific listing.
router.post(
    "/",isLoggedIn,
    validateReview,
    wrapAsync(reviewsController.createReview));

//delete review route
router.delete("/:reviewId", isLoggedIn,isReviewAuthor,
    wrapAsync(reviewsController.destroyReview)
);
module.exports = router;
