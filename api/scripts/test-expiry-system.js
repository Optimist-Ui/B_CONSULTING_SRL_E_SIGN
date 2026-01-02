/**
 * Diagnostic script to test package expiry system
 * Tests both ExpiryJob (package expiration) and expiry reminders
 * 
 * Usage:
 * 1. Create test packages with expiry dates
 * 2. Run: node scripts/test-expiry-system.js
 * 3. Check if packages expire correctly and reminders fire
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Package = require("../src/models/PackageModel");
const User = require("../src/models/UserModel");

async function testExpirySystem() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const now = new Date();

    // ═══════════════════════════════════════════════════════════════
    // PART 1: TEST EXPIRY JOB (Packages that should expire)
    // ═══════════════════════════════════════════════════════════════
    console.log("═".repeat(80));
    console.log("🔴 PART 1: TESTING PACKAGE EXPIRY JOB");
    console.log("═".repeat(80) + "\n");

    const packagesToExpire = await Package.find({
      "options.expiresAt": { $exists: true, $ne: null, $lte: now },
      status: { $in: ["Sent", "Draft"] },
    }).populate("ownerId", "firstName lastName email");

    console.log(`📦 Found ${packagesToExpire.length} packages that should be expired\n`);

    if (packagesToExpire.length > 0) {
      for (const pkg of packagesToExpire) {
        const hoursOverdue = (now - pkg.options.expiresAt) / (1000 * 60 * 60);
        
        console.log("━".repeat(80));
        console.log(`Package: ${pkg.name}`);
        console.log(`ID: ${pkg._id}`);
        console.log(`Owner: ${pkg.ownerId?.firstName} ${pkg.ownerId?.lastName}`);
        console.log(`Current Status: ${pkg.status}`);
        console.log(`\n⏰ Expiry Details:`);
        console.log(`   Expired at: ${pkg.options.expiresAt.toISOString()}`);
        console.log(`   Hours overdue: ${hoursOverdue.toFixed(2)}`);
        console.log(`   ${hoursOverdue > 0 ? "⚠️  SHOULD BE EXPIRED NOW!" : "✅ Not yet expired"}`);
        
        // Check if expiry reminder was sent
        if (pkg.options.expiryReminderSentAt) {
          console.log(`\n📨 Expiry Reminder:`);
          console.log(`   Sent at: ${pkg.options.expiryReminderSentAt.toISOString()}`);
          const hoursBefore = (pkg.options.expiresAt - pkg.options.expiryReminderSentAt) / (1000 * 60 * 60);
          console.log(`   Sent ${hoursBefore.toFixed(2)} hours before expiry`);
        } else {
          console.log(`\n📨 Expiry Reminder: Not sent`);
        }

        // Show unsigned participants who will receive expiry notification
        console.log(`\n👥 Participants (will receive expiry notification):`);
        const unsignedParticipants = new Set();
        pkg.fields.forEach((field) => {
          (field.assignedUsers || []).forEach((user) => {
            if (!user.signed) {
              unsignedParticipants.add(user.contactEmail);
            }
          });
        });
        
        console.log(`   Unsigned participants: ${unsignedParticipants.size}`);
        if (unsignedParticipants.size > 0) {
          Array.from(unsignedParticipants).forEach(email => {
            console.log(`   - ${email}`);
          });
        }
        
        // Include receivers
        if (pkg.receivers && pkg.receivers.length > 0) {
          console.log(`   Receivers: ${pkg.receivers.length}`);
          pkg.receivers.forEach(r => {
            console.log(`   - ${r.contactEmail}`);
          });
        }
        
        console.log(`   Owner: ${pkg.ownerId?.email} (always notified)`);
        console.log("━".repeat(80) + "\n");
      }
    } else {
      console.log("✅ No packages currently need to be expired\n");
    }

    // ═══════════════════════════════════════════════════════════════
    // PART 2: TEST EXPIRY REMINDERS (Before expiration)
    // ═══════════════════════════════════════════════════════════════
    console.log("\n" + "═".repeat(80));
    console.log("🔔 PART 2: TESTING EXPIRY REMINDERS (Before Expiration)");
    console.log("═".repeat(80) + "\n");

    const packagesNeedingReminders = await Package.find({
      "options.expiresAt": { $gt: now }, // Not yet expired
      "options.sendExpirationReminders": true,
      "options.reminderPeriod": { $ne: null },
      status: "Sent",
    }).populate("ownerId", "firstName lastName email");

    console.log(`📦 Found ${packagesNeedingReminders.length} packages with expiry reminders enabled\n`);

    if (packagesNeedingReminders.length > 0) {
      for (const pkg of packagesNeedingReminders) {
        const timeUntilExpiry = pkg.options.expiresAt.getTime() - now.getTime();
        const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);
        const daysUntilExpiry = timeUntilExpiry / (1000 * 60 * 60 * 24);
        
        console.log("━".repeat(80));
        console.log(`Package: ${pkg.name}`);
        console.log(`ID: ${pkg._id}`);
        console.log(`Owner: ${pkg.ownerId?.firstName} ${pkg.ownerId?.lastName}`);
        console.log(`Status: ${pkg.status}`);
        
        console.log(`\n⏰ Expiry Settings:`);
        console.log(`   Expires at: ${pkg.options.expiresAt.toISOString()}`);
        console.log(`   Hours until expiry: ${hoursUntilExpiry.toFixed(2)}`);
        console.log(`   Days until expiry: ${daysUntilExpiry.toFixed(2)}`);
        console.log(`   Reminder period: ${pkg.options.reminderPeriod}`);
        
        console.log(`\n📨 Reminder Status:`);
        if (pkg.options.expiryReminderSentAt) {
          console.log(`   ✅ Already sent at: ${pkg.options.expiryReminderSentAt.toISOString()}`);
        } else {
          console.log(`   ⏳ Not sent yet`);
          
          // Test if reminder should be sent now
          const shouldSend = shouldSendExpiryReminder(pkg.options.reminderPeriod, timeUntilExpiry);
          
          if (shouldSend) {
            console.log(`   ⚠️  SHOULD SEND REMINDER NOW!`);
          } else {
            console.log(`   ❌ Not in reminder window yet`);
          }
          
          // Show when reminder will be sent
          const reminderTiming = getReminderTiming(pkg.options.reminderPeriod);
          console.log(`   📅 Will send: ${reminderTiming.description}`);
          console.log(`   🕐 Reminder window: ${reminderTiming.window}`);
        }

        // Show unsigned participants who will receive reminder
        console.log(`\n👥 Participants (will receive reminder):`);
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
          Array.from(unsignedParticipants).forEach(email => {
            console.log(`   - ${email}`);
          });
        } else {
          console.log(`   ✅ All participants have completed their tasks`);
        }
        
        console.log("━".repeat(80) + "\n");
      }
    } else {
      console.log("✅ No packages currently have expiry reminders pending\n");
    }

    // ═══════════════════════════════════════════════════════════════
    // PART 3: SUMMARY & RECOMMENDATIONS
    // ═══════════════════════════════════════════════════════════════
    console.log("\n" + "═".repeat(80));
    console.log("📊 SUMMARY");
    console.log("═".repeat(80) + "\n");

    console.log(`Packages to expire: ${packagesToExpire.length}`);
    console.log(`Packages with pending expiry reminders: ${packagesNeedingReminders.length}`);
    
    const totalPendingActions = packagesToExpire.length + 
      packagesNeedingReminders.filter(pkg => !pkg.options.expiryReminderSentAt && 
        shouldSendExpiryReminder(
          pkg.options.reminderPeriod, 
          pkg.options.expiresAt.getTime() - now.getTime()
        )).length;
    
    if (totalPendingActions > 0) {
      console.log(`\n⚠️  ${totalPendingActions} pending action(s) detected!`);
      console.log(`\nRecommendations:`);
      if (packagesToExpire.length > 0) {
        console.log(`   • Run ExpiryJob to expire ${packagesToExpire.length} package(s)`);
      }
      const remindersToSend = packagesNeedingReminders.filter(pkg => 
        !pkg.options.expiryReminderSentAt && 
        shouldSendExpiryReminder(
          pkg.options.reminderPeriod, 
          pkg.options.expiresAt.getTime() - now.getTime()
        )
      ).length;
      if (remindersToSend > 0) {
        console.log(`   • Run ReminderJob to send ${remindersToSend} expiry reminder(s)`);
      }
    } else {
      console.log(`\n✅ No pending actions - system is up to date!`);
    }

    console.log("\n" + "═".repeat(80) + "\n");

    await mongoose.connection.close();
    console.log("✅ Done\n");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

/**
 * Replica of the logic in ReminderJob
 */
function shouldSendExpiryReminder(reminderPeriod, timeUntilExpiry) {
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;
  const TOLERANCE = 15 * 60 * 1000; // 15-minute tolerance

  // Must be positive time remaining
  if (timeUntilExpiry <= 0) return false;

  switch (reminderPeriod) {
    case "1_hour_before":
      return (
        timeUntilExpiry <= HOUR + TOLERANCE &&
        timeUntilExpiry > HOUR - TOLERANCE
      );
    case "2_hours_before":
      return (
        timeUntilExpiry <= 2 * HOUR + TOLERANCE &&
        timeUntilExpiry > 2 * HOUR - TOLERANCE
      );
    case "1_day_before":
      return (
        timeUntilExpiry <= DAY + TOLERANCE &&
        timeUntilExpiry > DAY - TOLERANCE
      );
    case "2_days_before":
      return (
        timeUntilExpiry <= 2 * DAY + TOLERANCE &&
        timeUntilExpiry > 2 * DAY - TOLERANCE
      );
    default:
      return false;
  }
}

/**
 * Get human-readable reminder timing info
 */
function getReminderTiming(reminderPeriod) {
  switch (reminderPeriod) {
    case "1_hour_before":
      return {
        description: "1 hour before expiry",
        window: "45 min - 1h 15min before expiry"
      };
    case "2_hours_before":
      return {
        description: "2 hours before expiry",
        window: "1h 45min - 2h 15min before expiry"
      };
    case "1_day_before":
      return {
        description: "1 day before expiry",
        window: "23h 45min - 24h 15min before expiry"
      };
    case "2_days_before":
      return {
        description: "2 days before expiry",
        window: "47h 45min - 48h 15min before expiry"
      };
    default:
      return {
        description: "Unknown",
        window: "Unknown"
      };
  }
}

testExpirySystem();