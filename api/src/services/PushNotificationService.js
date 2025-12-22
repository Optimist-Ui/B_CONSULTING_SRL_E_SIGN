// services/PushNotificationService.js
const admin = require("firebase-admin");

class PushNotificationService {
    constructor() {
        // Initialize Firebase Admin SDK
        if (!admin.apps.length) {
            // Check if Firebase credentials are provided via environment variable
            // Supports: JSON string, base64 encoded JSON, or file path
            if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                try {
                    let serviceAccount;

                    // Try parsing as JSON string first
                    try {
                        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                    } catch (parseError) {
                        // If JSON parse fails, try base64 decode
                        try {
                            const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf-8');
                            serviceAccount = JSON.parse(decoded);
                            console.log("✅ Decoded FIREBASE_SERVICE_ACCOUNT from base64");
                        } catch (base64Error) {
                            throw new Error("FIREBASE_SERVICE_ACCOUNT must be valid JSON string or base64 encoded JSON");
                        }
                    }

                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount),
                    });
                    console.log("✅ Firebase Admin SDK initialized from environment variable");
                } catch (error) {
                    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:", error);
                    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT format");
                }
            } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
                const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
                console.log("✅ Firebase Admin SDK initialized from file path");
            } else {
                console.warn(
                    "⚠️ Firebase Admin SDK not initialized. Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH"
                );
            }
        }
        this.messaging = admin.messaging();
    }

    /**
     * Send push notification to a single device
     * @param {string} deviceToken - FCM device token
     * @param {string} type - Notification type (document_signed, document_signing, etc.)
     * @param {string} packageId - Package ID for navigation
     * @param {string} title - Notification title
     * @param {string} body - Notification body
     * @returns {Promise<Object>} FCM response
     */
    async sendNotification(deviceToken, type, packageId, title, body) {
        if (!admin.apps.length) {
            console.warn("⚠️ Firebase Admin SDK not initialized, skipping push notification");
            return null;
        }

        const message = {
            notification: {
                title: title,
                body: body,
            },
            data: {
                type: type,
                packageId: packageId || "",
            },
            token: deviceToken,
        };

        try {
            const response = await this.messaging.send(message);
            console.log(`✅ Push notification sent successfully: ${response}`);
            return { success: true, messageId: response };
        } catch (error) {
            console.error("❌ Error sending push notification:", error);

            // Handle invalid token errors
            if (error.code === "messaging/invalid-registration-token" ||
                error.code === "messaging/registration-token-not-registered") {
                console.log(`⚠️ Invalid or unregistered token: ${deviceToken}`);
                return { success: false, error: "invalid_token", shouldRemove: true };
            }

            return { success: false, error: error.message };
        }
    }

    /**
     * Send push notification to multiple devices
     * @param {Array<string>} deviceTokens - Array of FCM device tokens
     * @param {string} type - Notification type
     * @param {string} packageId - Package ID for navigation
     * @param {string} title - Notification title
     * @param {string} body - Notification body
     * @returns {Promise<Object>} Results with success/failure counts
     */
    async sendNotificationToMultiple(deviceTokens, type, packageId, title, body) {
        if (!admin.apps.length || !deviceTokens || deviceTokens.length === 0) {
            return { success: 0, failed: 0, invalidTokens: [] };
        }

        const message = {
            notification: {
                title: title,
                body: body,
            },
            data: {
                type: type,
                packageId: packageId || "",
            },
        };

        try {
            // Use sendMulticast for multiple tokens
            const response = await this.messaging.sendMulticast({
                ...message,
                tokens: deviceTokens,
            });

            const invalidTokens = [];
            let successCount = 0;
            let failedCount = 0;

            response.responses.forEach((resp, idx) => {
                if (resp.success) {
                    successCount++;
                } else {
                    failedCount++;
                    // Check if token is invalid and should be removed
                    if (
                        resp.error?.code === "messaging/invalid-registration-token" ||
                        resp.error?.code === "messaging/registration-token-not-registered"
                    ) {
                        invalidTokens.push(deviceTokens[idx]);
                    }
                }
            });

            console.log(
                `📱 Push notifications sent: ${successCount} success, ${failedCount} failed`
            );

            return {
                success: successCount,
                failed: failedCount,
                invalidTokens: invalidTokens,
            };
        } catch (error) {
            console.error("❌ Error sending multicast push notification:", error);
            return { success: 0, failed: deviceTokens.length, invalidTokens: [] };
        }
    }

    /**
     * Send notification to all devices of a user
     * @param {Object} user - User object with deviceTokens array
     * @param {string} type - Notification type
     * @param {string} packageId - Package ID
     * @param {string} title - Notification title
     * @param {string} body - Notification body
     * @returns {Promise<Object>} Results
     */
    async sendNotificationToUser(user, type, packageId, title, body) {
        if (!user || !user.deviceTokens || user.deviceTokens.length === 0) {
            return { success: 0, failed: 0, invalidTokens: [] };
        }

        const deviceTokens = user.deviceTokens.map((dt) => dt.token);
        return await this.sendNotificationToMultiple(
            deviceTokens,
            type,
            packageId,
            title,
            body
        );
    }
}

module.exports = PushNotificationService;

