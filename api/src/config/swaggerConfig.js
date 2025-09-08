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
