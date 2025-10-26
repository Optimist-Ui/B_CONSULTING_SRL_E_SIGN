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

    // 🔥 NEW: Calculate required credits for packages being sent
    let creditsNeeded = 1; // Default to 1 credit
    let uniqueSignerCount = 0;

    if (req.body.status === "Sent" && req.body.fields) {
      // Calculate unique signers from the request body
      const uniqueSignerIds = new Set();
      req.body.fields.forEach((field) => {
        if (field.type === "signature") {
          (field.assignedUsers || []).forEach((assignedUser) => {
            if (assignedUser.role === "Signer") {
              uniqueSignerIds.add(assignedUser.contactId.toString());
            }
          });
        }
      });

      uniqueSignerCount = uniqueSignerIds.size;
      // Formula: 1 credit per 2 unique signers (rounded up)
      creditsNeeded = Math.ceil(uniqueSignerCount / 2);

      console.log(
        `Package requires ${creditsNeeded} credit(s) for ${uniqueSignerCount} unique signer(s)`
      );
    }

    // 3. Check if user has unlimited documents (skip credit check)
    const hasUnlimitedDocuments = totalDocumentLimit === -1;

    if (!hasUnlimitedDocuments) {
      // 4. Check if user has enough credits for this operation
      if (remainingDocuments < creditsNeeded) {
        const isTrialing = user.subscription.status === "trialing";

        let errorMessage;
        if (creditsNeeded > 1) {
          // Multi-credit package
          if (isTrialing) {
            errorMessage = `This package requires ${creditsNeeded} credits (${uniqueSignerCount} unique signers), but you only have ${remainingDocuments} remaining in your trial. Please activate your plan to continue.`;
          } else {
            errorMessage = `This package requires ${creditsNeeded} credits (${uniqueSignerCount} unique signers), but you only have ${remainingDocuments} remaining. Please upgrade or top-up your plan to continue.`;
          }
        } else {
          // Standard single-credit package
          if (isTrialing) {
            errorMessage = `You have reached your trial limit of ${totalDocumentLimit} documents. Please activate your plan to continue.`;
          } else {
            errorMessage = `You have reached your monthly limit of ${totalDocumentLimit} documents. Please upgrade or top-up your plan to continue.`;
          }
        }

        return res.status(403).json({
          success: false,
          error: errorMessage,
          errorCode: "INSUFFICIENT_CREDITS",
          details: {
            creditsRequired: creditsNeeded,
            uniqueSigners: uniqueSignerCount,
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
    }

    // 5. Add useful subscription info to the request
    req.userWithSubscription = user;
    req.subscriptionInfo = {
      documentLimit: totalDocumentLimit,
      documentsUsed: totalDocumentsUsed,
      documentsRemaining: remainingDocuments,
      creditsNeeded: creditsNeeded, // 🔥 NEW: Pass credits needed to controller
      uniqueSigners: uniqueSignerCount, // 🔥 NEW: Pass unique signer count
      isTrialing: user.subscription.status === "trialing",
      hasActiveSubscription: true,
      canCreateDocument: canCreateDocument,
      hasUnlimitedDocuments: hasUnlimitedDocuments,
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
