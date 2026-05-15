const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const chatbotController = require("../controllers/chatbot");

// POST /chatbot — receive a message, return AI reply
router.post("/chatbot", wrapAsync(chatbotController.chat));

module.exports = router;
