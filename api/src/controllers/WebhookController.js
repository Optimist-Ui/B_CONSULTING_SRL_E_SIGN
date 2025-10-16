class WebhookController {
  constructor({ subscriptionService, stripe }) {
    this.subscriptionService = subscriptionService;
    this.stripe = stripe;
  }

  async handleStripeEvents(req, res) {
    // Use the raw body for signature verification
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      // req.body is already the raw buffer when using express.raw() middleware
      event = this.stripe.webhooks.constructEvent(
        req.body,
        sig,
        endpointSecret
      );
    } catch (err) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
      switch (event.type) {
        // These two events are the primary source of truth for subscription status
        case "customer.subscription.created":
        case "customer.subscription.updated":
          const subscription = event.data.object;
          await this.subscriptionService.handleSubscriptionUpdate(
            subscription.id
          );
          break;

        case "customer.subscription.deleted":
          const subscriptionDeleted = event.data.object;
          await this.subscriptionService.handleSubscriptionDeleted(
            subscriptionDeleted.id
          );
          break;

        // Handle invoice payments - this is where trial transitions happen
        case "invoice.payment_succeeded":
          const invoice = event.data.object;

          console.log(`Payment succeeded for invoice: ${invoice.id}`);
          console.log(`Billing reason: ${invoice.billing_reason}`);

          // Handle different billing scenarios
          if (invoice.billing_reason === "subscription_create") {
            // New subscription without trial
            await this.subscriptionService.processSubscriptionConfirmationEmail(
              invoice
            );
          } else if (invoice.billing_reason === "subscription_cycle") {
            // This could be either a trial-to-active transition or regular renewal
            // The processSubscriptionConfirmationEmail method will determine which one
            await this.subscriptionService.processSubscriptionConfirmationEmail(
              invoice
            );
          }
          break;

        case "invoice.payment_failed":
          const failedInvoice = event.data.object;
          console.log(`Payment failed for invoice: ${failedInvoice.id}`);
          // You might want to handle payment failures here
          // await this.subscriptionService.handlePaymentFailure(failedInvoice);
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }
    } catch (error) {
      console.error(`Error handling webhook event ${event.type}:`, error);
      return res.status(500).json({ error: "Webhook processing failed" });
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
  }
}

module.exports = WebhookController;
