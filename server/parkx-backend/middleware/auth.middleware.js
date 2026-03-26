import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("[ParkX BE][AuthMiddleware] header received", {
      hasAuthHeader: Boolean(authHeader),
      path: req.originalUrl,
    });

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ message: "Invalid Authorization Format" });
    }

    const token = parts[1];
    const jwtSecret = process.env.JWT_SECRET || "SECRET_KEY";
    const decoded = jwt.verify(token, jwtSecret);

    req.userId = decoded.userId || decoded.id;
    if (!req.userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    console.log("[ParkX BE][AuthMiddleware] token verified", {
      userId: req.userId,
      path: req.originalUrl,
    });

    next();
  } catch (err) {
    console.error("[ParkX BE][AuthMiddleware] token verification failed", err?.message || err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authMiddleware;
