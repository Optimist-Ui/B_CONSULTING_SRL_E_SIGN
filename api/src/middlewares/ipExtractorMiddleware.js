const { getClientIp } = require("../utils/ipHelper");

/**
 * Middleware to extract and attach the real client IP to all requests
 * Must be used AFTER app.set('trust proxy', 1) in app.js
 *
 * Usage in app.js:
 *   app.set('trust proxy', 1);  // Trust the first proxy (Nginx)
 *   app.use(ipExtractorMiddleware);
 */
const ipExtractorMiddleware = (req, res, next) => {
  req.clientIp = getClientIp(req);
  next();
};

module.exports = ipExtractorMiddleware;