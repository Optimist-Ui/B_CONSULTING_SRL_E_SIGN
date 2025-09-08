const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "B-Consulting E-Sign API",
      version: "1.0.0",
      description:
        "This is the official API documentation for the B-Consulting E-Sign platform. It provides endpoints for managing users, packages, contacts, and more.",
      contact: {
        name: "B-Consulting Support",
        url: "https://your-company-website.com",
        email: "alexandros-your-career.eu",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Local Development server",
      },
      {
        url: "https://api-dev.e-sign.eu.com/",
        description: "Development server",
      },
      {
        url: "https://api-uat.e-sign.eu.com",
        description: "UAT server",
      },
      {
        url: "https://api.e-sign.eu.com",
        description: "Production server",
      },
    ],
    // ✅ Add tags to group your routes in the Swagger UI
    tags: [
      {
        name: "Contacts",
        description: "Operations related to user contacts",
      },
      {
        name: "Reviews",
        description: "Operations for creating and viewing package reviews.",
      },
      // 👇 NEW TAG
      {
        name: "Payment Methods",
        description:
          "Operations for managing an authenticated user's saved payment methods with Stripe.",
      },
      // 👇 NEW TAG
      {
        name: "Users",
        description:
          "User authentication, profile management, and password reset operations.",
      },
      // 👇 NEW TAG
      {
        name: "Subscriptions",
        description: "Endpoints for managing user subscriptions and plans.",
      },
      // 👇 NEW TAG
      {
        name: "Templates",
        description:
          "Operations for uploading, creating, and managing reusable document templates.",
      },
      // 👇 NEW TAG
      {
        name: "Packages",
        description:
          "The core module for creating, managing, and signing e-signature packages.",
      },
    ],
    // ✅ Define reusable components like schemas and security
    components: {
      // Reusable schemas based on your Mongoose model and validations
      schemas: {
        // Schema for creating a contact (matches createContactValidation)
        ContactInput: {
          type: "object",
          required: ["firstName", "lastName", "email"],
          properties: {
            firstName: { type: "string", example: "John" },
            lastName: { type: "string", example: "Doe" },
            email: {
              type: "string",
              format: "email",
              example: "john.doe@example.com",
            },
            title: { type: "string", example: "Project Manager" },
            phone: { type: "string", example: "+1234567890" },
            dob: {
              type: "string",
              format: "date",
              example: "1990-05-20",
            },
            language: { type: "string", example: "en" },
            customFields: {
              type: "object",
              additionalProperties: { type: "string" },
              example: { linkedin_profile: "https://linkedin.com/in/johndoe" },
            },
          },
        },
        // Schema representing a contact in the database (matches the Mongoose model)
        Contact: {
          allOf: [
            // Inherits all properties from ContactInput
            { $ref: "#/components/schemas/ContactInput" },
            {
              // And adds read-only, server-generated properties
              type: "object",
              properties: {
                _id: {
                  type: "string",
                  example: "60d0fe4f5311236168a109ca",
                },
                ownerId: {
                  type: "string",
                  example: "60d0fe4f5311236168a109cb",
                },
                createdAt: {
                  type: "string",
                  format: "date-time",
                },
                updatedAt: {
                  type: "string",
                  format: "date-time",
                },
              },
            },
          ],
        },
        // Schema for generic error responses
        Error: {
          type: "object",
          properties: {
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  msg: { type: "string", example: "Invalid value" },
                  param: { type: "string", example: "email" },
                },
              },
            },
          },
        },
        // 👇 NEW SCHEMAS FOR REVIEWS
        ReviewInput: {
          type: "object",
          required: ["answers"],
          properties: {
            answers: {
              type: "object",
              description: "Ratings for the standard questions.",
              required: ["easeOfUse", "clarity", "speed", "overall"],
              properties: {
                easeOfUse: {
                  type: "integer",
                  minimum: 1,
                  maximum: 5,
                  example: 5,
                },
                clarity: {
                  type: "integer",
                  minimum: 1,
                  maximum: 5,
                  example: 4,
                },
                speed: { type: "integer", minimum: 1, maximum: 5, example: 5 },
                overall: {
                  type: "integer",
                  minimum: 1,
                  maximum: 5,
                  example: 5,
                },
              },
            },
            comment: {
              type: "string",
              maxLength: 2000,
              example: "The process was very smooth and intuitive!",
            },
          },
        },
        Review: {
          type: "object",
          properties: {
            _id: { type: "string", example: "60d0fe4f5311236168a109cc" },
            packageId: { type: "string", example: "60d0fe4f5311236168a109cd" },
            ownerId: { type: "string", example: "60d0fe4f5311236168a109cb" },
            reviewerId: {
              type: "string",
              example: "unique-participant-id-123",
            },
            reviewerEmail: {
              type: "string",
              format: "email",
              example: "signer@example.com",
            },
            reviewerName: { type: "string", example: "John Signer" },
            reviewerRole: {
              type: "string",
              enum: ["Initiator", "Signer", "Approver", "FormFiller"],
              example: "Signer",
            },
            answers: {
              type: "object",
              properties: {
                easeOfUse: { type: "integer", example: 5 },
                clarity: { type: "integer", example: 4 },
                speed: { type: "integer", example: 5 },
                overall: { type: "integer", example: 5 },
              },
            },
            averageRating: { type: "number", example: 4.75 },
            comment: {
              type: "string",
              example: "The process was very smooth and intuitive!",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        FeaturedReview: {
          type: "object",
          properties: {
            reviewerName: { type: "string", example: "Jane D." },
            averageRating: { type: "number", example: 5 },
            comment: {
              type: "string",
              example: "Excellent service, very easy to use!",
            },
          },
        },
        Eligibility: {
          type: "object",
          properties: {
            eligible: { type: "boolean", example: true },
            message: {
              type: "string",
              example: "You are eligible to leave a review.",
            },
          },
        },
        // 👇 NEW SCHEMAS FOR PAYMENT METHODS
        PaymentMethod: {
          type: "object",
          description:
            "Represents a saved payment method (e.g., a credit card).",
          properties: {
            id: {
              type: "string",
              description: "Stripe Payment Method ID.",
              example: "pm_1JqQbRLdWTb3gH5sV4cM9gAb",
            },
            brand: {
              type: "string",
              description: "The card brand (e.g., visa, mastercard).",
              example: "visa",
            },
            last4: {
              type: "string",
              description: "The last four digits of the card number.",
              example: "4242",
            },
            exp_month: {
              type: "integer",
              description: "Card expiration month (1-12).",
              example: 12,
            },
            exp_year: {
              type: "integer",
              description: "Card expiration year.",
              example: 2025,
            },
            isDefault: {
              type: "boolean",
              description: "True if this is the user's default payment method.",
            },
          },
        },
        PaymentMethodIdInput: {
          type: "object",
          required: ["paymentMethodId"],
          properties: {
            paymentMethodId: {
              type: "string",
              description:
                "The ID of the Stripe Payment Method (e.g., pm_1J2b3c4d5e6f...).",
              example: "pm_1JqQbRLdWTb3gH5sV4cM9gAb",
            },
          },
        },
        // 👇 NEW SCHEMAS FOR USERS & AUTHENTICATION
        UserInput: {
          type: "object",
          required: ["firstName", "lastName", "email", "password"],
          properties: {
            firstName: { type: "string", example: "John" },
            lastName: { type: "string", example: "Doe" },
            email: {
              type: "string",
              format: "email",
              example: "john.doe@example.com",
            },
            password: {
              type: "string",
              format: "password",
              minLength: 6,
              example: "password123",
            },
          },
        },
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "john.doe@example.com",
            },
            password: {
              type: "string",
              format: "password",
              example: "password123",
            },
          },
        },
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "60d0fe4f5311236168a109cb" },
            firstName: { type: "string", example: "John" },
            lastName: { type: "string", example: "Doe" },
            email: {
              type: "string",
              format: "email",
              example: "john.doe@example.com",
            },
            phone: { type: "string", example: "123-456-7890" },
            language: { type: "string", example: "en" },
            profileImage: {
              type: "string",
              format: "uri",
              example: "https://.../public/images/profile.jpg",
            },
            isVerified: { type: "boolean" },
            // ... (include other relevant, non-sensitive user fields from your model)
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            token: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            user: { $ref: "#/components/schemas/User" },
          },
        },
        UpdateProfileInput: {
          type: "object",
          properties: {
            firstName: { type: "string", example: "John" },
            lastName: { type: "string", example: "Doe" },
            email: {
              type: "string",
              format: "email",
              example: "john.doe@example.com",
            },
            phone: { type: "string", nullable: true, example: "987-654-3210" },
            language: { type: "string", example: "en" },
            profileImage: {
              type: "string",
              format: "binary",
              description: "The profile image file to upload.",
            },
          },
        },
        ChangePasswordInput: {
          type: "object",
          required: ["currentPassword", "newPassword"],
          properties: {
            currentPassword: {
              type: "string",
              format: "password",
              example: "password123",
            },
            newPassword: {
              type: "string",
              format: "password",
              minLength: 6,
              example: "newStrongPassword",
            },
          },
        },
        EmailInput: {
          type: "object",
          required: ["email"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "john.doe@example.com",
            },
          },
        },
        ResetPasswordInput: {
          type: "object",
          required: ["resetToken", "newPassword"],
          properties: {
            resetToken: { type: "string", example: "a1b2c3d4e5f6..." },
            newPassword: {
              type: "string",
              format: "password",
              minLength: 6,
              example: "myNewSecurePassword",
            },
          },
        },
        // 👇 NEW SCHEMAS FOR SUBSCRIPTIONS
        Plan: {
          type: "object",
          properties: {
            _id: { type: "string", example: "60d0fe4f5311236168a109de" },
            name: { type: "string", example: "Pro Plan" },
            description: {
              type: "string",
              example: "For professionals with advanced needs.",
            },
            price: { type: "number", format: "float", example: 49.99 },
            currency: { type: "string", example: "usd" },
            features: {
              type: "array",
              items: { type: "string" },
              example: [
                "Unlimited Packages",
                "Team Features",
                "Advanced Branding",
              ],
            },
            stripePriceId: { type: "string", example: "price_1Jq..." },
          },
        },
        Subscription: {
          type: "object",
          properties: {
            subscriptionId: { type: "string", example: "sub_1Jq..." },
            planId: { type: "string", example: "60d0fe4f5311236168a109de" },
            planName: { type: "string", example: "Pro Plan" },
            status: {
              type: "string",
              enum: [
                "trialing",
                "active",
                "past_due",
                "canceled",
                "incomplete",
                "unpaid",
              ],
              example: "active",
            },
            current_period_start: { type: "string", format: "date-time" },
            current_period_end: { type: "string", format: "date-time" },
            trial_end: { type: "string", format: "date-time", nullable: true },
          },
        },
        CreateSubscriptionInput: {
          type: "object",
          required: ["priceId", "paymentMethodId"],
          properties: {
            priceId: {
              type: "string",
              description: "The Stripe Price ID for the selected plan.",
              example: "price_1JqQbRLdWTb3gH5sV4cM9gAb",
            },
            paymentMethodId: {
              type: "string",
              description: "The ID of the Stripe Payment Method.",
              example: "pm_1JqQbRLdWTb3gH5sV4cM9gAc",
            },
          },
        },
        Invoice: {
          type: "object",
          description: "Represents a Stripe invoice.",
          properties: {
            id: { type: "string", example: "in_1Jq..." },
            amount_paid: { type: "integer", example: 4999 },
            created: { type: "integer", format: "unix-timestamp" },
            currency: { type: "string", example: "usd" },
            status: {
              type: "string",
              enum: ["paid", "open", "uncollectible"],
              example: "paid",
            },
            invoice_pdf: {
              type: "string",
              format: "uri",
              example: "https://pay.stripe.com/invoice/...",
            },
          },
        },
        // 👇 NEW SCHEMAS FOR TEMPLATES
        DocumentFieldOption: {
          type: "object",
          required: ["value", "label"],
          properties: {
            value: { type: "string", example: "option_1" },
            label: { type: "string", example: "First Choice" },
          },
        },
        DocumentField: {
          type: "object",
          required: [
            "id",
            "type",
            "page",
            "x",
            "y",
            "width",
            "height",
            "required",
            "label",
          ],
          properties: {
            id: { type: "string", example: "nanoid-123" },
            type: {
              type: "string",
              enum: [
                "text",
                "signature",
                "checkbox",
                "radio",
                "textarea",
                "date",
                "dropdown",
              ],
              example: "text",
            },
            page: { type: "integer", example: 1 },
            x: { type: "number", example: 110.5 },
            y: { type: "number", example: 250.2 },
            width: { type: "number", example: 150 },
            height: { type: "number", example: 24 },
            required: { type: "boolean", example: true },
            label: { type: "string", example: "Full Name" },
            placeholder: { type: "string", example: "Enter your full name" },
            options: {
              type: "array",
              items: { $ref: "#/components/schemas/DocumentFieldOption" },
            },
            groupId: {
              type: "string",
              description: "Used to group radio buttons.",
              example: "radio-group-1",
            },
          },
        },
        TemplateInput: {
          type: "object",
          required: ["name", "attachment_uuid", "fileUrl", "fields"],
          properties: {
            name: { type: "string", example: "Standard NDA" },
            attachment_uuid: {
              type: "string",
              example: "uuid-from-upload-12345",
            },
            fileUrl: {
              type: "string",
              format: "uri",
              example: "/public/uploads/template.pdf",
            },
            fields: {
              type: "array",
              items: { $ref: "#/components/schemas/DocumentField" },
            },
          },
        },
        UpdateTemplateInput: {
          type: "object",
          properties: {
            name: { type: "string", example: "Updated NDA Template" },
            fields: {
              type: "array",
              items: { $ref: "#/components/schemas/DocumentField" },
            },
          },
        },
        Template: {
          allOf: [
            { $ref: "#/components/schemas/TemplateInput" },
            {
              type: "object",
              properties: {
                _id: { type: "string", example: "60d0fe4f5311236168a109df" },
                ownerId: {
                  type: "string",
                  example: "60d0fe4f5311236168a109cb",
                },
                docuTemplateId: {
                  type: "string",
                  example: "auto-generated-id",
                },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
              },
            },
          ],
        },
        TemplateUploadResponse: {
          type: "object",
          properties: {
            attachment_uuid: {
              type: "string",
              example: "uuid-from-upload-12345",
            },
            fileUrl: {
              type: "string",
              format: "uri",
              example: "/public/uploads/template.pdf",
            },
          },
        },
        // 👇 NEW SCHEMAS FOR PACKAGES (VERY DETAILED)
        AssignedUser: {
          type: "object",
          required: ["id", "contactId", "contactName", "contactEmail", "role"],
          properties: {
            id: { type: "string", example: "participant-uuid-1" },
            contactId: {
              type: "string",
              format: "ObjectId",
              example: "60d0fe4f5311236168a109ca",
            },
            contactName: { type: "string", example: "Jane Signer" },
            contactEmail: {
              type: "string",
              format: "email",
              example: "jane.signer@example.com",
            },
            role: {
              type: "string",
              enum: ["Signer", "FormFiller", "Approver"],
            },
            signatureMethods: {
              type: "array",
              description: "Required only if role is 'Signer'",
              items: { type: "string", enum: ["Email OTP", "SMS OTP"] },
              example: ["Email OTP"],
            },
          },
        },
        PackageReceiver: {
          type: "object",
          required: ["id", "contactId", "contactName", "contactEmail"],
          properties: {
            id: { type: "string", example: "receiver-uuid-1" },
            contactId: { type: "string", format: "ObjectId" },
            contactName: { type: "string", example: "Legal Team" },
            contactEmail: {
              type: "string",
              format: "email",
              example: "legal@example.com",
            },
          },
        },
        PackageField: {
          // Note: This is similar to DocumentField but includes 'assignedUsers' and 'value'
          allOf: [
            { $ref: "#/components/schemas/DocumentField" },
            {
              type: "object",
              properties: {
                assignedUsers: {
                  type: "array",
                  items: { $ref: "#/components/schemas/AssignedUser" },
                },
                value: {
                  type: "object",
                  description:
                    "The current value of the field (can be any type).",
                },
              },
            },
          ],
        },
        PackageOptions: {
          type: "object",
          properties: {
            expiresAt: { type: "string", format: "date-time", nullable: true },
            sendExpirationReminders: { type: "boolean", default: false },
            reminderPeriod: {
              type: "string",
              enum: [
                "1_day_before",
                "2_days_before",
                "1_hour_before",
                "2_hours_before",
              ],
              nullable: true,
            },
            sendAutomaticReminders: { type: "boolean", default: false },
            firstReminderDays: { type: "integer", example: 3 },
            repeatReminderDays: { type: "integer", example: 2 },
            allowDownloadUnsigned: { type: "boolean", default: true },
            allowReassign: { type: "boolean", default: true },
            allowReceiversToAdd: { type: "boolean", default: true },
          },
        },
        Package: {
          type: "object",
          properties: {
            _id: { type: "string", format: "ObjectId" },
            ownerId: { type: "string", format: "ObjectId" },
            templateId: { type: "string", format: "ObjectId", nullable: true },
            attachment_uuid: { type: "string", format: "uuid" },
            name: { type: "string", example: "Client Agreement Q3" },
            fileUrl: { type: "string", format: "uri" },
            fields: {
              type: "array",
              items: { $ref: "#/components/schemas/PackageField" },
            },
            receivers: {
              type: "array",
              items: { $ref: "#/components/schemas/PackageReceiver" },
            },
            options: { $ref: "#/components/schemas/PackageOptions" },
            status: {
              type: "string",
              enum: [
                "Draft",
                "Sent",
                "Completed",
                "Archived",
                "Rejected",
                "Expired",
                "Revoked",
              ],
              example: "Sent",
            },
            // ... (Other properties like rejectionDetails, reassignmentHistory could be added here for full detail)
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        PackageInput: {
          type: "object",
          properties: {
            name: { type: "string", example: "Client Agreement Q3" },
            attachment_uuid: { type: "string", format: "uuid" },
            fileUrl: { type: "string", format: "uri" },
            templateId: { type: "string", format: "ObjectId", nullable: true },
            status: {
              type: "string",
              enum: ["Draft", "Sent"],
              default: "Draft",
            },
            fields: {
              type: "array",
              items: { $ref: "#/components/schemas/PackageField" },
            },
            receivers: {
              type: "array",
              items: { $ref: "#/components/schemas/PackageReceiver" },
            },
            options: { $ref: "#/components/schemas/PackageOptions" },
          },
        },
        UpdatePackageInput: {
          type: "object",
          description:
            "Fields for updating a package. Only include the fields you want to change.",
          properties: {
            name: { type: "string", example: "Updated Client Agreement" },
            status: {
              type: "string",
              enum: ["Draft", "Sent", "Completed", "Archived"],
            },
            fields: {
              type: "array",
              items: { $ref: "#/components/schemas/PackageField" },
            },
            receivers: {
              type: "array",
              items: { $ref: "#/components/schemas/PackageReceiver" },
            },
            options: { $ref: "#/components/schemas/PackageOptions" },
          },
        },
        SendOtpInput: {
          type: "object",
          required: ["fieldId", "email"],
          properties: {
            fieldId: {
              type: "string",
              description:
                "The ID of the signature field requiring authentication.",
            },
            email: { type: "string", format: "email" },
          },
        },
        SendSmsOtpInput: {
          type: "object",
          required: ["fieldId", "phone"],
          properties: {
            fieldId: { type: "string" },
            phone: { type: "string", example: "+15551234567" },
          },
        },
        VerifyOtpInput: {
          type: "object",
          required: ["fieldId", "otp"],
          properties: {
            fieldId: { type: "string" },
            otp: { type: "string", minLength: 6, maxLength: 6 },
          },
        },
        SubmitFieldsInput: {
          type: "object",
          required: ["fieldValues"],
          properties: {
            fieldValues: {
              type: "object",
              description:
                "Key-value pairs where key is the field ID and value is the data being submitted.",
              additionalProperties: true, // Allows any property
              example: { field_nanoid_1: "John Doe", field_nanoid_2: true },
            },
          },
        },
        RejectPackageInput: {
          type: "object",
          required: ["reason"],
          properties: {
            reason: {
              type: "string",
              minLength: 1,
              maxLength: 500,
              example: "The terms in section 2 are incorrect.",
            },
          },
        },
        RevokePackageInput: {
          type: "object",
          properties: {
            reason: {
              type: "string",
              maxLength: 500,
              example: "Sent to the wrong client by mistake.",
            },
          },
        },
        PerformReassignmentInput: {
          type: "object",
          required: ["newContactId", "reason"],
          properties: {
            newContactId: { type: "string", format: "ObjectId" },
            reason: { type: "string", minLength: 1, maxLength: 500 },
          },
        },
        ReassignmentEligibility: {
          type: "object",
          properties: {
            eligible: { type: "boolean" },
            message: { type: "string" },
          },
        },
      },
      // Security schemes for JWT authentication
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT in the format: Bearer {token}",
        },
      },
    },
    // Global security requirement for all endpoints
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Corrected path to be relative to the project root where you run the script
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
