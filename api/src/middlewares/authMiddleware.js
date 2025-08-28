const { verifyToken } = require("../utils/jwtHandler");
const { errorResponse } = require("../utils/responseHandler");

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Extract token from header

  if (!token) {
    return errorResponse(res, "Access denied. No token provided.", "Unauthorized", 401);
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return errorResponse(res, "Invalid or expired token.", "Unauthorized", 401);
  }

  req.user = decoded; // Attach decoded user info to request
  next();
};

module.exports = authMiddleware;
