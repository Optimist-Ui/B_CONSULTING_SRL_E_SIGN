const mongoose = require("mongoose");
const { Schema } = mongoose;

const contactSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    title: { type: String }, // e.g., "CEO", "Project Manager"
    phone: { type: String },
    dob: { type: Date },
    language: { type: String, default: "en" },
    // For custom fields, a flexible key-value map is best
    customFields: {
      type: Map,
      of: String,
    },
  },
  { timestamps: true }
);

// A user shouldn't have two contacts with the same email
contactSchema.index({ ownerId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("Contact", contactSchema);
