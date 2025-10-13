// middleware/checkPackageExpiry.js

/**
 * Middleware to check package expiry on every access
 * Provides instant expiry enforcement without waiting for cron
 */
const checkPackageExpiry = async (req, res, next) => {
  try {
    const { packageId } = req.params;
    
    if (!packageId) {
      return next();
    }

    const Package = req.container.resolve('Package');
    const packageService = req.container.resolve('packageService');
    const emailService = req.container.resolve('emailService');
    
    const pkg = await Package.findById(packageId).populate('ownerId', 'firstName lastName email');
    
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Check if package should be expired
    if (pkg.options.expiresAt && 
        new Date() >= pkg.options.expiresAt && 
        ['Sent', 'Draft'].includes(pkg.status)) {
      
      console.log(`⚡ Real-time expiry detected for package ${pkg._id}`);
      
      // Expire immediately
      pkg.status = 'Expired';
      await pkg.save();
      
      // Send notifications (async, don't block response)
      setImmediate(async () => {
        try {
          await sendExpiryNotifications(pkg, emailService);
          await packageService.emitPackageUpdate(pkg);
        } catch (error) {
          console.error('Error sending expiry notifications:', error);
        }
      });
      
      // Return expired status
      return res.status(410).json({ 
        error: 'This document has expired',
        expiredAt: pkg.options.expiresAt,
        status: 'Expired'
      });
    }

    // Attach package to request for downstream use
    req.package = pkg;
    next();
    
  } catch (error) {
    console.error('Error in checkPackageExpiry middleware:', error);
    next(error);
  }
};

async function sendExpiryNotifications(pkg, emailService) {
  const owner = pkg.ownerId;
  const ownerName = `${owner.firstName} ${owner.lastName}`;

  const participantEmails = new Set([
    owner.email,
    ...pkg.fields.flatMap(f => f.assignedUsers.map(au => au.contactEmail)),
    ...pkg.receivers.map(r => r.contactEmail)
  ]);

  for (const email of participantEmails) {
    try {
      await emailService.sendDocumentExpiredNotification(
        email,
        ownerName,
        pkg.name,
        pkg.options.expiresAt
      );
    } catch (error) {
      console.error(`Failed to send expiry email to ${email}:`, error);
    }
  }
}

module.exports = checkPackageExpiry;