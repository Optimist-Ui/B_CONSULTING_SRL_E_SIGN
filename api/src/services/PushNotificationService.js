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

                    // Validate service account has required fields
                    const requiredFields = ['project_id', 'private_key', 'client_email'];
                    const missingFields = requiredFields.filter(field => !serviceAccount[field]);
                    
                    if (missingFields.length > 0) {
                        throw new Error(`Service account missing required fields: ${missingFields.join(', ')}`);
                    }

                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount),
                    });
                    console.log("✅ Firebase Admin SDK initialized from environment variable");
                    
                    // Verify credentials by testing messaging access
                    this._verifyFirebaseCredentials();
                } catch (error) {
                    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:", error);
                    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT format");
                }
            } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
                const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
                // Validate service account has required fields
                const requiredFields = ['project_id', 'private_key', 'client_email'];
                const missingFields = requiredFields.filter(field => !serviceAccount[field]);
                
                if (missingFields.length > 0) {
                    throw new Error(`Service account missing required fields: ${missingFields.join(', ')}`);
                }

                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
                console.log("✅ Firebase Admin SDK initialized from file path");
                
                // Verify credentials by testing messaging access
                this._verifyFirebaseCredentials();
            } else {
                console.warn(
                    "⚠️ Firebase Admin SDK not initialized. Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH"
                );
            }
        }
        
        // Initialize messaging only if Firebase is initialized
        if (admin.apps.length > 0) {
            try {
                this.messaging = admin.messaging();
                // Verify messaging is properly initialized
                if (!this.messaging) {
                    console.warn("⚠️ Firebase messaging could not be initialized");
                } else {
                    console.log("✅ Firebase messaging initialized");
                }
            } catch (error) {
                console.error("❌ Error initializing Firebase messaging:", error);
                this.messaging = null;
            }
        } else {
            this.messaging = null;
        }
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
        if (!admin.apps.length || !this.messaging) {
            console.warn("⚠️ Firebase Admin SDK not initialized, skipping push notification");
            return { success: false, error: "firebase_not_initialized" };
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

            // Handle authentication errors
            if (error.code === "messaging/third-party-auth-error" || 
                error.code === "messaging/authentication-error" ||
                error.message?.includes("authentication credential")) {
                console.error("❌ Firebase authentication failed. Please check your service account credentials.");
                console.error("   Error details:", error.errorInfo || error.message);
                return { success: false, error: "authentication_error", shouldRetry: false };
            }

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

        if (!this.messaging) {
            console.warn("⚠️ Firebase messaging not initialized, skipping push notifications");
            return { success: 0, failed: deviceTokens.length, invalidTokens: [] };
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
            // Check if sendMulticast is available (Firebase Admin SDK v9+)
            if (typeof this.messaging.sendMulticast === 'function') {
                // Use sendMulticast for multiple tokens (more efficient)
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
            } else {
                // Fallback: Send individual notifications if sendMulticast is not available
                console.log(`⚠️ sendMulticast not available, sending ${deviceTokens.length} individual notifications`);
                return await this._sendIndividualNotifications(deviceTokens, type, packageId, title, body);
            }
        } catch (error) {
            console.error("❌ Error sending multicast push notification:", error);
            // Fallback to individual notifications on error
            console.log(`⚠️ Falling back to individual notifications due to error`);
            return await this._sendIndividualNotifications(deviceTokens, type, packageId, title, body);
        }
    }

    /**
     * Fallback method to send notifications individually
     * @private
     */
    async _sendIndividualNotifications(deviceTokens, type, packageId, title, body) {
        const invalidTokens = [];
        let successCount = 0;
        let failedCount = 0;

        // Send notifications one by one
        for (const token of deviceTokens) {
            try {
                const result = await this.sendNotification(token, type, packageId, title, body);
                if (result && result.success) {
                    successCount++;
                } else {
                    failedCount++;
                    if (result && result.shouldRemove) {
                        invalidTokens.push(token);
                    }
                }
            } catch (error) {
                console.error(`❌ Error sending notification to token ${token.substring(0, 20)}...:`, error);
                failedCount++;
            }
        }

        console.log(
            `📱 Push notifications sent (individual): ${successCount} success, ${failedCount} failed`
        );

        return {
            success: successCount,
            failed: failedCount,
            invalidTokens: invalidTokens,
        };
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

    /**
     * Verify Firebase credentials are valid by checking if we can access messaging
     * @private
     */
    async _verifyFirebaseCredentials() {
        if (!this.messaging) {
            return;
        }

        try {
            // Try to get the app instance to verify credentials
            const app = admin.app();
            if (app) {
                console.log(`✅ Firebase project verified: ${app.options.projectId || 'unknown'}`);
            }
        } catch (error) {
            console.error("❌ Firebase credentials verification failed:", error.message);
            console.error("   Please check your FIREBASE_SERVICE_ACCOUNT configuration");
            this.messaging = null;
        }
    }
}

module.exports = PushNotificationService;

