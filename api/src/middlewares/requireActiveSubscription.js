// This middleware checks if a user has a valid subscription (active or trialing).
// It enforces document limits based on the user's status.
// It should be placed *after* the `authenticateUser` middleware in your routes.

const requireActiveSubscription = (container) => async (req, res, next) => {
  try {
    const User = container.resolve("User");

    // Fetch the user with their full subscription and plan details
    const user = await User.findById(req.user.id).populate(
      "subscription.planId"
    );

    if (!user) {
      return res
        .status(401)
        .json({
          success: false,
          error: "User not found.",
          errorCode: "USER_NOT_FOUND",
        });
    }

    // --- FIX #1: Allow 'trialing' status ---
    // 1. Check for a valid, active, or trialing subscription status.
    if (
      !user.subscription ||
      !["active", "trialing"].includes(user.subscription.status)
    ) {
      return res.status(403).json({
        // 403 Forbidden is the correct status code
        success: false,
        error:
          "An active subscription or trial is required to access this feature.",
        errorCode: "SUBSCRIPTION_INACTIVE",
      });
    }

    // --- FIX #2: Determine the correct document limit ---
    const plan = user.subscription.planId;
    const isTrialing = user.subscription.status === "trialing";

    // Set the effective document limit: 3 for trials, or the plan's limit for active users.
    const documentLimit = isTrialing ? 3 : plan ? plan.documentLimit : 0;

    // 2. Check for document limit against the *effective* limit
    if (
      plan &&
      documentLimit !== -1 &&
      user.documentsCreatedThisMonth >= documentLimit
    ) {
      // Provide a more specific error message depending on the status
      const errorMessage = isTrialing
        ? `You have reached your trial limit of ${documentLimit} documents. Please activate your plan to continue.`
        : `You have reached your monthly limit of ${documentLimit} documents. Please upgrade your plan to continue.`;

      return res.status(403).json({
        success: false,
        error: errorMessage,
        errorCode: "DOCUMENT_LIMIT_REACHED",
      });
    }

    // Attach the fully populated user object to the request for use in the controller/service
    req.userWithSubscription = user;

    next(); // User has a valid subscription and is within limits, proceed to the next handler
  } catch (error) {
    console.error("Subscription check error:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Internal server error while verifying subscription.",
      });
  }
};

module.exports = requireActiveSubscription;
