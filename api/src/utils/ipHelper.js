/**
 * Extract the real client IP address from the request
 * Handles multiple proxy layers and IPv6-mapped IPv4 addresses
 * @param {Object} req - Express request object
 * @returns {string} The client's real IP address
 */
function getClientIp(req) {
  // 1. Check X-Forwarded-For header (set by Nginx or other reverse proxies)
  // This header can contain multiple IPs, so we take the first one (the original client)
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    // X-Forwarded-For can be "client_ip, proxy1_ip, proxy2_ip..."
    // We want the first IP (the actual client)
    const ips = forwarded.split(",").map((ip) => ip.trim());
    if (ips[0]) {
      return normalizeIpAddress(ips[0]);
    }
  }

  // 2. Check X-Real-IP header (alternative header set by some proxies)
  const realIp = req.headers["x-real-ip"];
  if (realIp) {
    return normalizeIpAddress(realIp);
  }

  // 3. Check CF-Connecting-IP (Cloudflare)
  const cfConnectingIp = req.headers["cf-connecting-ip"];
  if (cfConnectingIp) {
    return normalizeIpAddress(cfConnectingIp);
  }

  // 4. Fallback to Express's req.ip (which respects trust proxy setting)
  if (req.ip) {
    return normalizeIpAddress(req.ip);
  }

  // 5. Last resort: Direct connection
  const remoteAddress = req.connection.remoteAddress || req.socket.remoteAddress;
  if (remoteAddress) {
    return normalizeIpAddress(remoteAddress);
  }

  return "UNKNOWN";
}

/**
 * Normalize IP address by converting IPv6-mapped IPv4 to plain IPv4
 * Example: ::ffff:172.17.0.1 -> 172.17.0.1
 * @param {string} ip - Raw IP address
 * @returns {string} Normalized IP address
 */
function normalizeIpAddress(ip) {
  if (!ip) return "UNKNOWN";

  // Remove any whitespace
  ip = ip.trim();

  // Convert IPv6-mapped IPv4 addresses (::ffff:x.x.x.x) to IPv4
  if (ip.startsWith("::ffff:")) {
    return ip.substring(7);
  }

  // If it's IPv6 loopback (::1), convert to 127.0.0.1
  if (ip === "::1") {
    return "127.0.0.1";
  }

  return ip;
}

/**
 * Log IP extraction info for debugging
 * @param {Object} req - Express request object
 */
function logIpDebugInfo(req) {
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 IP Debug Info:");
    console.log("  X-Forwarded-For:", req.headers["x-forwarded-for"] || "not set");
    console.log("  X-Real-IP:", req.headers["x-real-ip"] || "not set");
    console.log("  CF-Connecting-IP:", req.headers["cf-connecting-ip"] || "not set");
    console.log("  req.ip:", req.ip);
    console.log("  req.ips:", req.ips);
    console.log("  remoteAddress:", req.connection.remoteAddress);
    console.log("  Final IP:", getClientIp(req));
  }
}

module.exports = {
  getClientIp,
  normalizeIpAddress,
  logIpDebugInfo,
};