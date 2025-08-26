// const jwt = require('jsonwebtoken'); // Import the jsonwebtoken library

// const verifyToken = (req, res, next) => {
//     const authHeader = req.headers.authorization;
//     console.log(authHeader);
    
//     if (!authHeader) return res.status(403).send("A token is required for authentication");

//     const token = authHeader.split(" ")[1];
//     console.log(token);

//     if (!token) return res.status(403).send("Token is missing");

//     console.log("Token received:", token);

//     jwt.verify(token, process.env.SECRET, (err, decoded) => {
//         if (err) {
//             console.error("Token verification failed:", err.message);
//             return res.status(401).send("Invalid Token");
//         }
//         req.user = decoded; // Attach user info to request
//         next();
//     });
// };

"use strict";
const jwt = require("jsonwebtoken");

module.exports = function verifyToken(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      return res.status(401).json({ status: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.SECRET);
    req.user = decoded;
    next();
} catch (err) {
    return res.status(401).json({ status: false, message: "Invalid or expired token" });
}
};

// module.exports = verifyToken;