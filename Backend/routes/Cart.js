const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");

// Add item to cart
router.post("/add", async (req, res) => {
  try {
    const { userId, foodItemId, quantity } = req.body;
    const cartItem = new Cart({ userId, foodItemId, quantity });
    await cartItem.save();
    res.json({ message: "Item added to cart" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user cart
router.get("/:userId", async (req, res) => {
  try {
    const cartItems = await Cart.find({ userId: req.params.userId }).populate("foodItemId");
    res.json(cartItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove item from cart
router.delete("/remove/:id", async (req, res) => {
  try {
    await Cart.findByIdAndDelete(req.params.id);
    res.json({ message: "Item removed from cart" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
