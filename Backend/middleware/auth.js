const jwt = require("jsonwebtoken");

function authenticateUser(req, res, next) {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];  // ✅ Extract token correctly

    if (!token) {
        return res.status(401).json({ error: "Token missing from request" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);  // ✅ Verify token
        req.userId = decoded.id || decoded.userId;  // ✅ Fix: Extract correct userId
        console.log("Extracted userId from token:", req.userId);  // ✅ Debugging
        next();
    } catch (error) {
        console.error("Token verification failed:", error);
        res.status(400).json({ error: "Invalid token" });
    }
}

module.exports = authenticateUser;
