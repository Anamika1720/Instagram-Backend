import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");
  // console.log("Received Authorization Header:", authHeader);

  if (!authHeader) {
    // console.log("No token provided!");
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  // console.log("Extracted Token:", token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("Token Decoded:", decoded);

    req.user = { userId: decoded.userId, username: decoded.username };
    // console.log("req.user:", {
    //   userId: decoded.userId,
    //   username: decoded.username,
    // });

    // console.log("User set in req.user:", req.user);

    next();
  } catch (err) {
    // console.log("JWT Verification Error:", err.message);
    res.status(401).json({ error: "Invalid token" });
  }
};

export default authMiddleware;
