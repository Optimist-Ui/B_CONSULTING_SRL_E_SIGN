// ./seed.js

const container = require("./src/config/container");
const dotenv = require("dotenv");

dotenv.config();

// --- Resolve all necessary components from the container ---
const db = container.resolve("db");
const User = container.resolve("User");
const Plan = container.resolve("Plan");

// --- Define the data to be seeded (Updated based on new logic) ---
const plans = [
  {
    name: "Starter",
    // monthlyPriceId: process.env.STARTER_MONTHLY_PRICE_ID,
    // yearlyPriceId: process.env.STARTER_YEARLY_PRICE_ID,
    monthlyPrice: 999, // €9.99 in cents
    yearlyPrice: 9999, // €99.99 in cents
    documentLimit: 27,
    features: [
      "27 Documents per Month",
      "Full access to all participant roles", // Updated
      "Create & Send Packages",
      "Save & Use Templates", // Updated
      "Sign via Email & SMS OTPs", // Updated
      "Document Tracking & Notifications",
    ],
    isEnterprise: false,
    vivaWalletEnabled: true,
    pricing: {
      EUR: {
        monthly: 999,
        yearly: 9999,
      },
      USD: {
        monthly: 1099, // $10.99 in cents
        yearly: 10999, // $109.99 in cents
      },
    },
  },
  {
    name: "Pro",
    // monthlyPriceId: process.env.PRO_MONTHLY_PRICE_ID,
    // yearlyPriceId: process.env.PRO_YEARLY_PRICE_ID,
    monthlyPrice: 2999, // €29.99 in cents
    yearlyPrice: 29999, // €299.99 in cents
    documentLimit: 60,
    features: [
      "60 Documents per Month", // Key difference
      "Includes all features of the Starter plan",
      "Higher document limit for growing businesses",
    ],
    isEnterprise: false,
    vivaWalletEnabled: true,
    pricing: {
      EUR: {
        monthly: 2999,
        yearly: 29999,
      },
      USD: {
        monthly: 3299, // $32.99 in cents
        yearly: 32999, // $329.99 in cents
      },
    },
  },
  {
    name: "Enterprise",
    documentLimit: -1, // -1 signifies custom/unlimited
    features: [
      "Custom Document Volume",
      "All features of the Pro plan",
      "Team Management & User Roles",
      "Dedicated Account Manager",
      "Custom Integrations & API Access",
    ],
    isEnterprise: true,
  },
];

// --- Main async function to run the seeding process ---
(async () => {
  try {
    // It's assumed your 'db' object from the container has a 'connect' method.
    await db.connect();
    console.log("✅ Database connected successfully for seeding.");

    // --- Seed Plans ---
    // This step makes the script re-runnable. It clears old plans before adding new ones.
    console.log("🔄 Removing old plans...");
    await Plan.deleteMany({});
    console.log("✅ Old plans removed.");

    console.log("🌱 Seeding new plans...");
    await Plan.insertMany(plans);
    console.log("✅ Plans have been successfully seeded!");

    // --- Seed Admin User ---
    console.log("👤 Seeding admin user...");
    const adminExists = await User.findOne({ email: "admin@example.com" });

    if (!adminExists) {
      await User.create({
        email: "admin@example.com",
        // In a real app, this password would be hashed during user creation logic
        password: "Admin123!",
        firstName: "Admin",
        lastName: "User",
        role: "admin", // Assuming your User model supports a 'role' field
      });
      console.log("✅ Admin user created successfully!");
    } else {
      console.log("⏭️ Admin user already exists, skipping creation.");
    }

    console.log("🎉 Seeding process completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1); // Exit with a failure code
  } finally {
    // Ensure the database connection is always closed
    await db.close();
    process.exit(0); // Exit with a success code
  }
})();
