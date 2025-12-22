// src/config/vivaWalletConfig.js

const axios = require("axios");

class VivaWalletConfig {
  constructor() {
    this.clientId = process.env.VIVA_WALLET_CLIENT_ID?.trim();
    this.clientSecret = process.env.VIVA_WALLET_CLIENT_SECRET?.trim();
    this.merchantId = process.env.VIVA_WALLET_MERCHANT_ID?.trim();
    this.apiKey = process.env.VIVA_WALLET_API_KEY?.trim();
    this.sourceCode = process.env.VIVA_WALLET_SOURCE_CODE?.trim();

    // API calls (create order, get transaction)
    this.baseURL =
      process.env.VIVA_WALLET_BASE_URL?.trim();

    // OAuth token
    this.accountsURL =
      process.env.VIVA_WALLET_ACCOUNTS_URL?.trim();

    // Checkout page & webhook verification
    this.checkoutURL =
      process.env.VIVA_WALLET_CHECKOUT_URL?.trim();

    this.accessToken = null;
    this.tokenExpiry = null;

    console.log("\n🔧 Viva Wallet Config Initialized:");
    console.log(`   Client ID: ${this.clientId?.substring(0, 20)}...`);
    console.log(`   Merchant ID: ${this.merchantId}`);
    console.log(`   Source Code: ${this.sourceCode}`);
    console.log(`   API URL: ${this.baseURL}`);
    console.log(`   Accounts URL: ${this.accountsURL}`);
    console.log(`   Checkout URL: ${this.checkoutURL}\n`);
  }

  /**
   * Get OAuth access token for Viva Wallet API
   */
  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      console.log("✅ Using cached Viva Wallet token");
      return this.accessToken;
    }

    try {
      console.log("🔄 Requesting new OAuth token from Viva Wallet...");

      const auth = Buffer.from(
        `${this.clientId}:${this.clientSecret}`
      ).toString("base64");

      const response = await axios.post(
        `${this.accountsURL}/connect/token`,
        "grant_type=client_credentials",
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 30000,
          maxRedirects: 5,
        }
      );

      this.accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiry = Date.now() + (expiresIn - 300) * 1000; // Refresh 5 min early

      console.log(`✅ OAuth token obtained (expires in ${expiresIn}s)`);
      return this.accessToken;
    } catch (error) {
      console.error(
        "❌ Viva Wallet OAuth Error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to obtain Viva Wallet access token");
    }
  }

  /**
   * Create authenticated Axios instance with retry logic
   */
  async createAuthenticatedClient() {
    const token = await this.getAccessToken();

    const instance = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 120000, // 120 second timeout
      maxRedirects: 5,
      validateStatus: (status) => status < 500,
    });

    // Request interceptor
    instance.interceptors.request.use(
      (config) => {
        console.log(
          `📤 Viva API Request: ${config.method?.toUpperCase()} ${
            config.baseURL
          }${config.url}`
        );
        return config;
      },
      (error) => {
        console.error("📤 Request Error:", error.message);
        return Promise.reject(error);
      }
    );

    // Response interceptor with retry logic
    instance.interceptors.response.use(
      (response) => {
        console.log(
          `📥 Viva API Response: ${response.status} ${response.statusText}`
        );
        return response;
      },
      async (error) => {
        const config = error.config;

        if (!config._retry) {
          config._retry = 0;
        }

        const retryableErrors = [
          "ECONNRESET",
          "ETIMEDOUT",
          "ECONNABORTED",
          "ENOTFOUND",
          "EAI_AGAIN",
        ];

        // Retry logic for network errors
        if (
          config._retry < 3 &&
          (retryableErrors.includes(error.code) ||
            error.message.includes("timeout"))
        ) {
          config._retry += 1;
          console.log(`🔄 Retrying request (attempt ${config._retry}/3)...`);

          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, 2000 * Math.pow(2, config._retry - 1))
          );

          return instance(config);
        }

        console.error(`📥 Viva API Error: ${error.message}`);
        console.error(`   Code: ${error.code}`);
        console.error(`   Response:`, error.response?.data);

        return Promise.reject(error);
      }
    );

    return instance;
  }

  /**
   * Create Axios instance with Basic Auth (for webhook verification)
   */
  createBasicAuthClient() {
    const auth = Buffer.from(`${this.merchantId}:${this.apiKey}`).toString(
      "base64"
    );

    return axios.create({
      baseURL: this.checkoutURL, // Use checkoutURL for webhook verification
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      timeout: 60000,
      maxRedirects: 5,
    });
  }

  /**
   * Clear token cache (useful for testing or errors)
   */
  clearTokenCache() {
    this.accessToken = null;
    this.tokenExpiry = null;
    console.log("🔄 Token cache cleared");
  }
}

module.exports = new VivaWalletConfig();