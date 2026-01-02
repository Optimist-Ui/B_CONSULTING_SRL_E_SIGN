/**
 * Diagnostic script to test 24h automatic reminders
 *
 * Usage:
 * 1. Create a test package via API with automatic reminders enabled
 * 2. Run: node scripts/test-24h-reminders.js
 * 3. Check if reminders fire correctly
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Package = require("../src/models/PackageModel");
const User = require("../src/models/UserModel"); // ✅ ADD THIS LINE

async function testAutomaticReminders() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const now = new Date();

    // Find packages with automatic reminders enabled
    const packages = await Package.find({
      "options.sendAutomaticReminders": true,
      "options.firstReminderDays": { $exists: true, $ne: null },
      $or: [
        { sentAt: { $exists: true, $ne: null } },
        { status: "Sent", createdAt: { $exists: true } },
      ],
      status: "Sent",
    }).populate("ownerId", "firstName lastName email");

    console.log(
      `\n📦 Found ${packages.length} packages with automatic reminders enabled\n`
    );

    for (const pkg of packages) {
      // ✅ UPDATED: Use fallback to createdAt if sentAt is missing
      const sentAt = new Date(pkg.sentAt || pkg.createdAt);
      const daysSinceSent = (now - sentAt) / (1000 * 60 * 60 * 24);
      const remindersSent = pkg.options.automaticRemindersSent || [];

      console.log("━".repeat(80));
      console.log(`Package: ${pkg.name}`);
      console.log(`ID: ${pkg._id}`);
      console.log(`Owner: ${pkg.ownerId?.firstName} ${pkg.ownerId?.lastName}`);
      console.log(`Status: ${pkg.status}`);
      console.log(`\n📅 Timing:`);
      // ✅ UPDATED: Show warning if using createdAt fallback
      console.log(
        `   Sent at: ${sentAt.toISOString()}${
          !pkg.sentAt ? " ⚠️  (using createdAt - sentAt missing)" : ""
        }`
      );
      console.log(`   Days since sent: ${daysSinceSent.toFixed(2)}`);
      console.log(
        `   First reminder threshold: ${pkg.options.firstReminderDays} days`
      );
      console.log(
        `   Repeat reminder interval: ${
          pkg.options.repeatReminderDays || "Not set"
        } days`
      );

      console.log(`\n📨 Reminder History:`);
      if (remindersSent.length === 0) {
        console.log(`   No reminders sent yet`);

        // Check if first reminder should be sent
        if (daysSinceSent >= pkg.options.firstReminderDays - 0.25) {
          console.log(`   ⚠️  SHOULD SEND FIRST REMINDER NOW!`);
        } else {
          const daysUntilFirstReminder =
            pkg.options.firstReminderDays - daysSinceSent;
          console.log(
            `   ⏳ First reminder in ${daysUntilFirstReminder.toFixed(2)} days`
          );
        }
      } else {
        remindersSent.forEach((reminder, index) => {
          const reminderDate = new Date(reminder.sentAt);
          const daysSinceReminder =
            (now - reminderDate) / (1000 * 60 * 60 * 24);
          console.log(
            `   ${index + 1}. Sent ${daysSinceReminder.toFixed(2)} days ago ` +
              `(${reminderDate.toISOString()}) to ${
                reminder.recipientCount
              } recipients`
          );
        });

        // Check if repeat reminder should be sent
        if (pkg.options.repeatReminderDays) {
          const lastReminder = remindersSent[remindersSent.length - 1];
          const lastReminderDate = new Date(lastReminder.sentAt);
          const daysSinceLastReminder =
            (now - lastReminderDate) / (1000 * 60 * 60 * 24);

          if (daysSinceLastReminder >= pkg.options.repeatReminderDays - 0.25) {
            console.log(`   ⚠️  SHOULD SEND REPEAT REMINDER NOW!`);
          } else {
            const daysUntilNextReminder =
              pkg.options.repeatReminderDays - daysSinceLastReminder;
            console.log(
              `   ⏳ Next reminder in ${daysUntilNextReminder.toFixed(2)} days`
            );
          }
        }
      }

      // Check unsigned participants
      console.log(`\n👥 Participants:`);
      const unsignedParticipants = new Set();
      pkg.fields.forEach((field) => {
        (field.assignedUsers || []).forEach((user) => {
          if (!user.signed) {
            unsignedParticipants.add(user.contactEmail);
          }
        });
      });

      console.log(`   Total unsigned: ${unsignedParticipants.size}`);
      if (unsignedParticipants.size > 0) {
        Array.from(unsignedParticipants).forEach((email) => {
          console.log(`   - ${email}`);
        });
      }

      // Check expiry
      if (pkg.options.expiresAt) {
        const timeUntilExpiry = pkg.options.expiresAt.getTime() - now.getTime();
        const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);

        if (hoursUntilExpiry < 0) {
          console.log(`\n⚠️  Package has expired!`);
        } else {
          console.log(`\n⏰ Expires in ${hoursUntilExpiry.toFixed(2)} hours`);
        }
      } else {
        console.log(`\n∞ No expiry set`);
      }

      console.log("━".repeat(80) + "\n");
    }

    // Test reminder logic
    console.log("\n🧪 TESTING REMINDER LOGIC:\n");

    for (const pkg of packages) {
      const shouldSend = shouldSendAutomaticReminder(pkg, now);
      console.log(`Package ${pkg.name} (${pkg._id}):`);
      console.log(
        `   Should send reminder now? ${shouldSend ? "✅ YES" : "❌ NO"}`
      );
    }

    await mongoose.connection.close();
    console.log("\n✅ Done");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

/**
 * Replica of the logic in ReminderJob
 */
function shouldSendAutomaticReminder(pkg, now) {
  // ✅ UPDATED: Use fallback to createdAt
  const sentAt = new Date(pkg.sentAt || pkg.createdAt);
  const firstReminderDays = pkg.options.firstReminderDays;
  const repeatReminderDays = pkg.options.repeatReminderDays;
  const remindersSent = pkg.options.automaticRemindersSent || [];

  // Calculate days since sent
  const daysSinceSent = (now - sentAt) / (1000 * 60 * 60 * 24);

  // First reminder
  if (remindersSent.length === 0) {
    return daysSinceSent >= firstReminderDays - 0.25;
  }

  // Repeat reminders
  if (!repeatReminderDays || repeatReminderDays <= 0) {
    return false;
  }

  const lastReminder = remindersSent[remindersSent.length - 1];
  const lastReminderDate = new Date(lastReminder.sentAt);
  const daysSinceLastReminder =
    (now - lastReminderDate) / (1000 * 60 * 60 * 24);

  return daysSinceLastReminder >= repeatReminderDays - 0.25;
}

testAutomaticReminders();
