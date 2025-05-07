const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("User API is working!");
});

module.exports = router; 
