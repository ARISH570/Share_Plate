  require('dotenv').config();
  const express = require('express');
  const mongoose = require('mongoose');
  const cors = require('cors');
  const jwt = require('jsonwebtoken');
  const bcrypt = require('bcryptjs');
  const nodemailer = require('nodemailer');
  const rateLimit = require('express-rate-limit');
  const helmet = require('helmet');
  const mongoSanitize = require('express-mongo-sanitize');
  const User = require('./models/User');
  const path = require('path');

  const app = express();
  const frontendPath = path.join(__dirname, '../Frontend');
  app.use(express.static(frontendPath));
  // Security Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(mongoSanitize());
  app.use('/api/orders', require('./routes/Order'));
  const ContactRoutes = require('./routes/ContactRoutes');
  //const Contact = require("./models/Contact"); // Import model

  const Order = require("./models/Order");  


  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });
  app.use(limiter);
  // API Routes

  // Database Connection
  const MONGO_URI = process.env.MONGO_URI;

  mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  })
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });
  app.use("/contact", ContactRoutes);
  // Email transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465, 
    secure: true,
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS
    }
  });

  // Test route
  app.get('/test', (req, res) => {
    res.status(200).json({ message: 'Server is working!' });
  });

  app.post("/api/contact", async (req, res) => {
    console.log("Received Data:", req.body); // Log the incoming request

    try {
        const { name, email, subject, message } = req.body;

        // Check if subject is missing
        if (!subject) {
            return res.status(400).json({ error: "Subject is required!" });
        }

        const newContact = new Contact({ name, email, subject, message });
        await newContact.save();

        res.status(201).json({ message: "Contact saved successfully!" });
    } catch (error) {
        console.error("Error saving contact:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Place Order Route
  app.post("/place-order", async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.json({ success: true, message: "Order placed successfully!" });
    } catch (error) {
        console.error("Error saving order:", error);
        res.status(500).json({ success: false, message: "Order failed!" });
    }
  });
  // User Registration
  app.post('/register', async (req, res) => {
    try {
      const { name, email, phone, ngo_registration_no, password } = req.body;

      // Validation
      if (!name || !email || !phone || !ngo_registration_no || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = new User({ 
        name, 
        email, 
        phone, 
        ngo_registration_no, 
        password: hashedPassword 
      });

      await user.save();

      // Generate token
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1d' }
      );

      // Send welcome email
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Welcome to Share Plate',
          html: `<p>Hi ${name},</p>
                <p>Thank you for registering with us!</p>
                <p>Your account has been successfully created.</p>`
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
      }

      res.status(201).json({ 
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });

    } catch (error) {
      console.error('Registration Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // User Login
  app.post('/login', async (req, res) => {

    try {
      const { email, password } = req.body;

      // Basic validation
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1d' }
      );

      res.json({ 
        token, 
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email, 
          role: user.role 
        } 
      });

    } catch (error) {
      console.error('Login Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Authentication Middleware
  const authMiddleware = (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      console.error('Authentication Error:', error);
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  };

  // Protected Routes
  app.get('/api/protected', authMiddleware, (req, res) => {
    res.json({ 
      message: 'Access granted', 
      user: req.user 
    });
  });

  // Token Verification
  app.get("/verify-token", authMiddleware, (req, res) => {
    res.json({ 
      email: req.user.email,
      id: req.user.id,
      role: req.user.role
    });
  });

  // Email Confirmation
  app.post('/api/confirm', authMiddleware, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Food Booking Confirmation',
        html: `<p>Your Food Order with order ID #${Math.floor(Math.random() * 10000)} has been confirmed!</p>
              <p>It will be delivered by ${new Date(Date.now() + 3600000).toLocaleTimeString()}.</p>`
      });

      res.json({ message: 'Confirmation sent successfully' });
    } catch (error) {
      console.error('Email Error:', error);
      res.status(500).json({ error: 'Failed to send confirmation' });
    }
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
  });

  // Start server
  const PORT = process.env.PORT || 5500;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });