const express = require("express");
const router = express.Router();

// Example route
router.get("/", (req, res) => {
  res.send("User API is working!");
});

module.exports = router; // ✅ Must export router
