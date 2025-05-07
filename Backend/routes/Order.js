const User = require("../models/User");  // ✅ Import the User model
const express = require("express");
const authenticateUser = require("../middleware/auth");
const Order = require("../models/Order");
const nodemailer = require("nodemailer");

const router = express.Router();

// ✅ Configure Email Transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ✅ Protected Order Route (Requires Token)
router.post("/place", authenticateUser, async (req, res) => {
    try {
        const { items, totalAmount } = req.body;
        const userId = req.userId;  // ✅ Extracted from token

        if (!userId) {
            return res.status(400).json({ error: "User ID missing from token" });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "Invalid order details" });
        }

        // ✅ Get user details (assuming you have a User model)
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // ✅ Save the order in the database
        const newOrder = new Order({
            user: userId,
            items,
            totalAmount,
            orderDate: new Date(),
        });

        await newOrder.save();

        // ✅ Send Email Confirmation
        const emailHtml = `
            <p>Hi ${user.name},</p>
            <p>Thank you for your order! Your order details are as follows:</p>
            <p><strong>Order ID:</strong> ${newOrder._id}</p>
            <p><strong>Items Ordered:</strong></p>
            <ul>
                ${items.map(item => `<li>${item.name} (x${item.quantity}) - ₹${item.price * item.quantity}</li>`).join("")}
            </ul>
            <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
            <p>Enjoy your meal!</p>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Food Order Confirmation",
            html: emailHtml
        });

        res.json({ success: true, message: "Order placed successfully! Confirmation email sent.", order: newOrder });

    } catch (error) {
        console.error("Error processing order:", error);
        res.status(500).json({ error: "Order failed!" });
    }
});

module.exports = router;

