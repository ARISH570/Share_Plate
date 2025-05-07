const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");

// POST route for contact form submission
router.post("/submit", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate data
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Save to database
    const newContact = new Contact({ name, email, subject, message });
    await newContact.save();

    res.status(201).json({ message: "Message sent successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
