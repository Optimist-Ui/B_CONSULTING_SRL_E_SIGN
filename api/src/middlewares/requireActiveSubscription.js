// Updated middleware to work with the new subscription history system

const requireActiveSubscription = (container) => async (req, res, next) => {
  try {
    const User = container.resolve("User");

    // Fetch the user with their full subscription and plan details
    const user = await User.findById(req.user.id).populate(
      "subscription.planId"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found.",
        errorCode: "USER_NOT_FOUND",
      });
    }

    // 1. Check for a valid, active, or trialing subscription status
    if (
      !user.subscription ||
      !["active", "trialing"].includes(user.subscription.status)
    ) {
      return res.status(403).json({
        success: false,
        error:
          "An active subscription or trial is required to access this feature.",
        errorCode: "SUBSCRIPTION_INACTIVE",
      });
    }

    // 2. Use the new User model methods to get document limits and usage
    const totalDocumentLimit = user.getTotalDocumentLimit();
    const totalDocumentsUsed = user.getTotalDocumentsUsed();
    const remainingDocuments = user.getRemainingDocuments();
    const canCreateDocument = user.canCreateDocument();

    // 3. Check if user can create documents
    if (!canCreateDocument) {
      const isTrialing = user.subscription.status === "trialing";

      let errorMessage;
      if (isTrialing) {
        errorMessage = `You have reached your trial limit of ${totalDocumentLimit} documents. Please activate your plan to continue.`;
      } else {
        errorMessage = `You have reached your monthly limit of ${totalDocumentLimit} documents. Please upgrade or top-up your plan to continue.`;
      }

      return res.status(403).json({
        success: false,
        error: errorMessage,
        errorCode: "DOCUMENT_LIMIT_REACHED",
        details: {
          documentsUsed: totalDocumentsUsed,
          documentLimit: totalDocumentLimit,
          documentsRemaining: remainingDocuments,
          isTrialing: isTrialing,
          subscriptionHistory: user.subscriptionHistory.filter(
            (h) => h.status === "active"
          ),
        },
      });
    }

    // 4. Add useful subscription info to the request
    req.userWithSubscription = user;
    req.subscriptionInfo = {
      documentLimit: totalDocumentLimit,
      documentsUsed: totalDocumentsUsed,
      documentsRemaining: remainingDocuments,
      isTrialing: user.subscription.status === "trialing",
      hasActiveSubscription: true,
      canCreateDocument: canCreateDocument,
      // Include active subscription history for debugging/display purposes
      activeSubscriptionEntries: user.subscriptionHistory.filter(
        (h) => h.status === "active"
      ),
    };

    next(); // User has a valid subscription and is within limits
  } catch (error) {
    console.error("Subscription check error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while verifying subscription.",
      errorCode: "INTERNAL_ERROR",
    });
  }
};

module.exports = requireActiveSubscription;
