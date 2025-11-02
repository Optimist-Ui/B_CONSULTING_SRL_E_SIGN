// services/ReviewService.js
class ReviewService {
  constructor({ Review, Package, emailService, User, Contact }) {
    this.Review = Review;
    this.Package = Package;
    this.EmailService = emailService;
    this.User = User;
    this.Contact = Contact;
  }

  async _findParticipant(pkg, participantId) {
    // Case 1: The participant ID matches the owner's ID
    if (pkg.ownerId.toString() === participantId) {
      const owner = await this.User.findById(pkg.ownerId).select(
        "firstName lastName email"
      );
      if (!owner) return null;
      return {
        id: owner._id.toString(),
        contactName: `${owner.firstName} ${owner.lastName}`,
        contactEmail: owner.email,
        role: "Initiator",
      };
    }

    // Case 2: The reviewer is a Signer, Approver, etc.
    let participant;
    for (const field of pkg.fields) {
      const foundUser = field.assignedUsers.find((u) => u.id === participantId);
      if (foundUser) {
        participant = foundUser;
        break;
      }
    }

    return participant
      ? {
          id: participant.id,
          contactName: participant.contactName,
          contactEmail: participant.contactEmail,
          role: participant.role,
        }
      : null;
  }

  // Simplified: No longer needs authenticatedUserId
  async checkReviewEligibility(participantId, packageId) {
    const pkg = await this.Package.findById(packageId);
    if (!pkg) throw new Error("Package not found.");

    const participant = await this._findParticipant(pkg, participantId);
    if (!participant)
      return {
        eligible: false,
        reason: "You are not a participant in this package.",
      };

    if (pkg.status !== "Completed")
      return {
        eligible: false,
        reason: "Reviews can only be submitted for completed packages.",
      };

    // --- MODIFIED QUERY ---
    // Check for an existing review using the participant's unique email address.
    const existingReview = await this.Review.findOne({
      packageId,
      reviewerEmail: participant.contactEmail,
    });
    // --- END OF MODIFICATION ---

    if (existingReview)
      return {
        eligible: false,
        reason: "You have already submitted a review for this package.",
      };

    return { eligible: true };
  }

  async createReview(participantId, packageId, reviewData) {
    const eligibility = await this.checkReviewEligibility(
      participantId,
      packageId
    );
    if (!eligibility.eligible) throw new Error(eligibility.reason);

    const pkg = await this.Package.findById(packageId);
    const participant = await this._findParticipant(pkg, participantId);

    // --- NEW: Fetch the participant's language preference ---
    const contact = await this.Contact.findById(participant.contactId).select(
      "language"
    );
    // Add language to the participant object, defaulting to 'en'
    participant.language = contact ? contact.language : "en";
    // --- END NEW ---

    const answerValues = Object.values(reviewData.answers);
    const averageRating =
      answerValues.reduce((sum, rating) => sum + rating, 0) /
      answerValues.length;

    const newReview = await this.Review.create({
      ...reviewData,
      packageId,
      ownerId: pkg.ownerId,
      reviewerId: participantId,
      reviewerName: participant.contactName,
      reviewerEmail: participant.contactEmail,
      reviewerRole: participant.role,
      averageRating,
    });

    // --- THIS IS THE FIX ---
    // Instead of using a temporary variable, use a simple if/else block
    // to call the methods directly on the EmailService object.

    if (averageRating > 3) {
      await this.EmailService.sendReviewAppreciationEmail(participant);
    } else {
      await this.EmailService.sendReviewImprovementEmail(participant);
    }
    // --- END OF FIX ---

    return newReview;
  }

  /**
   * Fetches a list of top-rated reviews suitable for public display.
   * This is a public method and does not require authentication.
   * @returns {Promise<Array<object>>} - A list of featured review objects.
   */
  async getFeaturedReviews() {
    // Find up to 5 reviews where:
    // 1. The average rating is 4 or higher.
    // 2. A comment was actually written.
    const featuredReviews = await this.Review.find({
      averageRating: { $gte: 4 }, // Rating is greater than or equal to 4
      comment: { $ne: null, $ne: "" }, // Ensure a comment exists
    })
      .sort({ createdAt: -1 }) // Get the most recent reviews first
      .limit(5) // Limit the result to a manageable number for display
      .select("reviewerName reviewerRole averageRating comment createdAt"); // <-- IMPORTANT: For security and privacy, only select fields that are safe to show publicly.

    return featuredReviews;
  }

  async getReviewsForPackage(userId, packageId) {
    // This function remains unchanged as it's for an authenticated user
    const pkg = await this.Package.findOne({ _id: packageId, ownerId: userId });
    if (!pkg)
      throw new Error(
        "Package not found or you do not have permission to view its reviews."
      );

    return this.Review.find({ packageId }).sort({ createdAt: -1 });
  }
}

module.exports = ReviewService;
