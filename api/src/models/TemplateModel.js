const mongoose = require("mongoose");
const { Schema } = mongoose;

const documentFieldSchema = new Schema({
  id: { type: String, required: true }, // Client-generated ID (nanoid)
  type: {
    type: String,
    enum: [
      "text",
      "signature",
      "checkbox",
      "radio",
      "textarea",
      "date",
      "dropdown",
    ],
    required: true,
  },
  page: { type: Number, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  required: { type: Boolean, default: false },
  label: { type: String, required: true },
  placeholder: { type: String, default: "" },
  options: [
    {
      value: { type: String, required: true },
      label: { type: String, required: true },
    },
  ],
  groupId: { type: String },
});

const templateSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    docuTemplateId: { type: String, required: true, unique: true },
    attachment_uuid: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    fields: [documentFieldSchema],
  },
  { timestamps: true }
);

// Ensure unique templates per user by attachment_uuid
templateSchema.index({ ownerId: 1, attachment_uuid: 1 }, { unique: true });

module.exports = mongoose.model("Template", templateSchema);
