const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class EpicGamesAuth {
  constructor() {
    this.clientId = process.env.EPIC_CLIENT_ID;
    this.clientSecret = process.env.EPIC_CLIENT_SECRET;
    // Use the most basic Epic Games endpoint
    this.epicApi = 'https://www.epicgames.com';
    this.deviceCode = null;
    this.userCode = null;
    this.verificationUri = "https://www.epicgames.com/id/activate";
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
    this.accountId = null;
  }

  async startDeviceFlow() {
    const data = new URLSearchParams({
      grant_type: 'device_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      device_id: uuidv4(),
      scope: 'basic_profile friends presence openid viewbackupcodes'
    });

    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    // Try multiple endpoints
    const endpoints = [
      'https://account-public-service-prod.ol.epicgames.com/account/api/oauth/device_authorization',
      'https://account-public-service.epicgames.com/account/api/oauth/device_authorization',
      'https://epicgames.com/account/api/oauth/device_authorization',
      'https://www.epicgames.com/account/api/oauth/device_authorization'
    ];

    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Trying endpoint: ${endpoint}`);
        const response = await axios.post(endpoint, data.toString(), config);
        
        if (response.status === 200) {
          const result = response.data;
          this.deviceCode = result.device_code;
          this.userCode = result.user_code;
          this.verificationUri = result.verification_uri || this.verificationUri;
          this.expiresIn = result.expires_in;
          this.interval = result.interval;

          // Store the base URL for future requests
          const url = new URL(endpoint);
          this.epicApi = `${url.protocol}//${url.host}`;

          console.log(`✅ Success with endpoint: ${endpoint}`);
          return {
            user_code: this.userCode,
            verification_uri: this.verificationUri,
            expires_in: this.expiresIn,
            interval: this.interval
          };
        }
      } catch (error) {
        lastError = error;
        console.log(`❌ Failed: ${endpoint} - ${error.message}`);
        continue;
      }
    }

    throw lastError || new Error('All endpoints failed');
  }

  async pollForToken() {
    if (!this.deviceCode) {
      throw new Error('Device flow not started');
    }

    const data = new URLSearchParams({
      grant_type: 'device_code',
      device_code: this.deviceCode,
      client_id: this.clientId,
      client_secret: this.clientSecret
    });

    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    try {
      const response = await axios.post(
        `${this.epicApi}/account/api/oauth/token`,
        data.toString(),
        config
      );

      if (response.status === 200) {
        const result = response.data;
        this.accessToken = result.access_token;
        this.refreshToken = result.refresh_token;
        this.expiresAt = Date.now() + (result.expires_in * 1000);
        return true;
      } else if (response.status === 400) {
        const errorData = response.data;
        if (errorData.error === 'authorization_pending') {
          return false;
        } else if (errorData.error === 'slow_down') {
          await new Promise(resolve => setTimeout(resolve, (this.interval || 5) * 2000));
          return false;
        } else {
          throw new Error(`Auth error: ${JSON.stringify(errorData)}`);
        }
      } else {
        throw new Error(`Token request failed: ${response.status}`);
      }
    } catch (error) {
      if (error.response) {
        throw new Error(`Token request failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  async getUserInfo() {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const config = {
      headers: {
        'Authorization': `bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    try {
      const response = await axios.get(
        `${this.epicApi}/account/api/oauth/accountInfo`,
        config
      );

      if (response.status === 200) {
        this.accountId = response.data.id;
        return response.data;
      } else {
        throw new Error(`Failed to get user info: ${response.status}`);
      }
    } catch (error) {
      if (error.response) {
        throw new Error(`Failed to get user info: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  isTokenExpired() {
    return !this.expiresAt || Date.now() >= this.expiresAt;
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const data = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret
    });

    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    try {
      const response = await axios.post(
        `${this.epicApi}/account/api/oauth/token`,
        data.toString(),
        config
      );

      if (response.status === 200) {
        const result = response.data;
        this.accessToken = result.access_token;
        this.refreshToken = result.refresh_token;
        this.expiresAt = Date.now() + (result.expires_in * 1000);
        return true;
      } else {
        throw new Error(`Token refresh failed: ${response.status}`);
      }
    } catch (error) {
      if (error.response) {
        throw new Error(`Token refresh failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  async ensureValidToken() {
    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }
  }

  async getBackupCodes() {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    await this.ensureValidToken();

    const config = {
      headers: {
        'Authorization': `bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    try {
      const response = await axios.get(
        `${this.epicApi}/account/api/public/account/${this.accountId}/backupCodes`,
        config
      );

      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(`Failed to get backup codes: ${response.status}`);
      }
    } catch (error) {
      if (error.response) {
        throw new Error(`Failed to get backup codes: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  async generateBackupCode() {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    await this.ensureValidToken();

    const config = {
      headers: {
        'Authorization': `bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    try {
      const response = await axios.post(
        `${this.epicApi}/account/api/public/account/${this.accountId}/backupCodes`,
        {},
        config
      );

      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(`Failed to generate backup code: ${response.status}`);
      }
    } catch (error) {
      if (error.response) {
        throw new Error(`Failed to generate backup code: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  async deleteBackupCode(codeId) {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    await this.ensureValidToken();

    const config = {
      headers: {
        'Authorization': `bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    try {
      const response = await axios.delete(
        `${this.epicApi}/account/api/public/account/${this.accountId}/backupCodes/${codeId}`,
        config
      );

      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(`Failed to delete backup code: ${response.status}`);
      }
    } catch (error) {
      if (error.response) {
        throw new Error(`Failed to delete backup code: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }
}

module.exports = { EpicGamesAuth };
