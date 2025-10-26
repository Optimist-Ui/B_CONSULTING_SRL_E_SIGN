// middlewares/containerMiddleware.js

/**
 * Middleware to inject the Awilix container into the request object
 * This allows upload middleware to access services like s3Service
 */
const injectContainer = (container) => {
  return (req, res, next) => {
    req.container = container;
    next();
  };
};

module.exports = injectContainer;