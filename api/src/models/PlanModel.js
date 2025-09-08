const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ["Starter", "Pro", "Enterprise"],
  },
  monthlyPriceId: {
    type: String,
  },
  yearlyPriceId: {
    type: String,
  },
  monthlyPrice: {
    type: Number,
  },
  yearlyPrice: {
    type: Number,
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
});

const Plan = mongoose.model("Plan", planSchema);

module.exports = Plan;