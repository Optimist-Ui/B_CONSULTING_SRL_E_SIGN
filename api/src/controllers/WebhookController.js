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

        // In WebhookController - add this case
        case "customer.subscription.updated":
          const updatedSub = event.data.object;
          console.log(
            `Subscription updated: ${updatedSub.id}, status: ${updatedSub.status}`
          );

          // CRITICAL FIX: Skip processing for very new subscriptions (upgrades/downgrades)
          // This prevents duplicate processing during upgrade/downgrade scenarios
          const now = Math.floor(Date.now() / 1000);
          const subscriptionAge = now - updatedSub.created;
          const isNewUpgradeDowngrade = subscriptionAge < 300; // Less than 5 minutes

          if (isNewUpgradeDowngrade) {
            console.log(
              `Skipping subscription update for ${updatedSub.id} - detected as upgrade/downgrade (age: ${subscriptionAge}s)`
            );
            break;
          }

          // Only process active or trialing subscriptions that aren't recent upgrades
          if (["active", "trialing"].includes(updatedSub.status)) {
            await this.subscriptionService.handleSubscriptionUpdate(
              updatedSub.id,
              "customer.subscription.updated"
            );
          } else if (updatedSub.status === "incomplete") {
            console.log(
              `Subscription ${updatedSub.id} is incomplete - waiting for payment`
            );
          } else if (["past_due", "unpaid"].includes(updatedSub.status)) {
            console.log(
              `Subscription ${updatedSub.id} has payment issues: ${updatedSub.status}`
            );
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
          console.log(`Amount paid: ${invoice.amount_paid / 100}`);

          // CRITICAL FIX: Check if this is an upgrade/downgrade scenario
          let isUpgradeDowngrade = false;
          if (invoice.subscription) {
            try {
              const subscription = await this.stripe.subscriptions.retrieve(
                invoice.subscription
              );

              // Check if this subscription was created very recently (likely upgrade/downgrade)
              const now = Math.floor(Date.now() / 1000);
              const subscriptionAge = now - subscription.created;
              isUpgradeDowngrade = subscriptionAge < 300; // Less than 5 minutes old

              console.log(
                `Retrieved subscription status: ${subscription.status}`
              );
              console.log(
                `Subscription age: ${subscriptionAge}s, isUpgradeDowngrade: ${isUpgradeDowngrade}`
              );

              // Now that payment succeeded, update the subscription in our database
              if (["active", "trialing"].includes(subscription.status)) {
                await this.subscriptionService.handleSubscriptionUpdate(
                  subscription.id,
                  "invoice.payment_succeeded", // Pass event type to prevent duplicates
                  isUpgradeDowngrade // Pass upgrade/downgrade flag
                );
              }
            } catch (error) {
              console.error(`Error retrieving subscription:`, error);
            }
          }

          // CRITICAL FIX: Enhanced email logic to prevent duplicates
          const isPaidInvoice = invoice.amount_paid > 0;
          const isTrialToPaid =
            invoice.billing_reason === "subscription_update";

          if (isPaidInvoice && !isTrialToPaid && !isUpgradeDowngrade) {
            // Send confirmation emails for new subscriptions and renewals ONLY
            if (invoice.billing_reason === "subscription_create") {
              // New subscription payment (first payment)
              await this.subscriptionService.processSubscriptionConfirmationEmail(
                invoice
              );
            } else if (invoice.billing_reason === "subscription_cycle") {
              // Regular renewal
              await this.subscriptionService.processSubscriptionConfirmationEmail(
                invoice
              );
            }
          } else if (!isPaidInvoice) {
            console.log(
              `Skipping confirmation email for $0 invoice (trial activation)`
            );
          } else if (isTrialToPaid) {
            console.log(
              `Trial-to-paid transition detected - email handled in handleSubscriptionUpdate`
            );
          } else if (isUpgradeDowngrade) {
            console.log(
              `Upgrade/downgrade detected - email handled in createSubscription`
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
