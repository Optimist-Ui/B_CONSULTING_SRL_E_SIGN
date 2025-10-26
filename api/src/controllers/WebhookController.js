class WebhookController {
  constructor({ subscriptionService, stripe }) {
    this.subscriptionService = subscriptionService;
    this.stripe = stripe;
  }

  async handleStripeEvents(req, res) {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.body,
        sig,
        endpointSecret
      );
    } catch (err) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "customer.subscription.created":
          const createdSub = event.data.object;
          console.log(
            `Subscription created: ${createdSub.id}, status: ${createdSub.status}`
          );

          // CRITICAL FIX: Only process if trialing or if it's a $0 subscription
          // For paid subscriptions, wait for invoice.payment_succeeded
          if (createdSub.status === "trialing") {
            await this.subscriptionService.handleSubscriptionUpdate(
              createdSub.id
            );
          } else if (
            createdSub.status === "incomplete" ||
            createdSub.status === "incomplete_expired"
          ) {
            console.log(
              `Subscription ${createdSub.id} is ${createdSub.status} - waiting for payment confirmation`
            );
            // Don't process incomplete subscriptions - wait for payment_succeeded
          } else if (createdSub.status === "active") {
            // Only process if the first invoice is paid (e.g., $0 trials or already paid)
            await this.subscriptionService.handleSubscriptionUpdate(
              createdSub.id
            );
          }
          break;

        case "customer.subscription.updated":
          const updatedSub = event.data.object;
          console.log(
            `Subscription updated: ${updatedSub.id}, status: ${updatedSub.status}`
          );

          // CRITICAL FIX: Only process active or trialing subscriptions
          // Don't sync incomplete, past_due, unpaid, or canceled subscriptions
          if (["active", "trialing"].includes(updatedSub.status)) {
            await this.subscriptionService.handleSubscriptionUpdate(
              updatedSub.id
            );
          } else if (updatedSub.status === "incomplete") {
            console.log(
              `Subscription ${updatedSub.id} is incomplete - waiting for payment`
            );
          } else if (["past_due", "unpaid"].includes(updatedSub.status)) {
            console.log(
              `Subscription ${updatedSub.id} has payment issues: ${updatedSub.status}`
            );
            // Optionally handle payment issues here
            // await this.subscriptionService.handlePaymentIssue(updatedSub.id);
          }
          break;

        case "customer.subscription.deleted":
          const subscriptionDeleted = event.data.object;
          await this.subscriptionService.handleSubscriptionDeleted(
            subscriptionDeleted.id
          );
          break;

        case "invoice.payment_succeeded":
          const invoice = event.data.object;
          console.log(`Payment succeeded for invoice: ${invoice.id}`);
          console.log(`Billing reason: ${invoice.billing_reason}`);
          console.log(`Subscription: ${invoice.subscription}`);

          // CRITICAL FIX: This is where we activate paid subscriptions
          if (invoice.subscription) {
            const subscription = await this.stripe.subscriptions.retrieve(
              invoice.subscription
            );

            console.log(
              `Retrieved subscription status: ${subscription.status}`
            );

            // Now that payment succeeded, update the subscription in our database
            if (["active", "trialing"].includes(subscription.status)) {
              await this.subscriptionService.handleSubscriptionUpdate(
                subscription.id
              );
            }
          }

          // Send confirmation emails based on billing reason
          if (invoice.billing_reason === "subscription_create") {
            // New subscription payment (first payment)
            await this.subscriptionService.processSubscriptionConfirmationEmail(
              invoice
            );
          } else if (invoice.billing_reason === "subscription_update") {
            // Trial-to-paid conversion - send confirmation
            await this.subscriptionService.processSubscriptionConfirmationEmail(
              invoice
            );
          } else if (invoice.billing_reason === "subscription_cycle") {
            // Regular renewal
            await this.subscriptionService.processSubscriptionConfirmationEmail(
              invoice
            );
          }
          break;

        case "invoice.payment_failed":
          const failedInvoice = event.data.object;
          console.log(`Payment failed for invoice: ${failedInvoice.id}`);
          console.log(`Subscription: ${failedInvoice.subscription}`);
          console.log(
            `Amount: ${failedInvoice.amount_due / 100} ${
              failedInvoice.currency
            }`
          );

          // CRITICAL FIX: Mark subscription as having payment issues
          if (failedInvoice.subscription) {
            await this.subscriptionService.handlePaymentFailure(
              failedInvoice.subscription,
              failedInvoice
            );
          }
          break;

        case "invoice.payment_action_required":
          const actionRequiredInvoice = event.data.object;
          console.log(
            `Payment action required for invoice: ${actionRequiredInvoice.id}`
          );
          // Handle 3D Secure or other payment actions
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }
    } catch (error) {
      console.error(`Error handling webhook event ${event.type}:`, error);
      return res.status(500).json({ error: "Webhook processing failed" });
    }

    res.json({ received: true });
  }
}

module.exports = WebhookController;
