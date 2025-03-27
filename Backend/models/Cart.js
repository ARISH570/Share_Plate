const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodItem", required: true },
  quantity: { type: Number, required: true, default: 1 },
});

module.exports = mongoose.model("Cart", CartSchema);
