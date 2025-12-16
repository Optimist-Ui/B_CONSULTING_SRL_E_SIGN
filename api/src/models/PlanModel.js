// src/models/Plan.js

const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ["Starter", "Pro", "Enterprise"],
  },

  // 🔴 DEPRECATED: Stripe fields (keep for backward compatibility or remove)
  monthlyPriceId: {
    type: String,
  },
  yearlyPriceId: {
    type: String,
  },

  // Pricing (in cents for consistency)
  monthlyPrice: {
    type: Number,
    required: function () {
      return !this.isEnterprise; // Only required if NOT enterprise
    },
  },
  yearlyPrice: {
    type: Number,
    required: function () {
      return !this.isEnterprise; // Only required if NOT enterprise
    },
  },

  documentLimit: {
    type: Number,
    required: true,
  },

  features: [
    {
      type: String,
    },
  ],

  isEnterprise: {
    type: Boolean,
    default: false,
  },

  // 🆕 Viva Wallet specific fields
  vivaWalletEnabled: {
    type: Boolean,
    default: true,
  },

  // Optional: Different pricing for different regions
  pricing: {
    EUR: {
      monthly: { type: Number },
      yearly: { type: Number },
    },
    USD: {
      monthly: { type: Number },
      yearly: { type: Number },
    },
  },
});

const Plan = mongoose.model("Plan", planSchema);

module.exports = Plan;
