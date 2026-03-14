const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class EpicGamesAuth {
  constructor() {
    this.clientId = process.env.EPIC_CLIENT_ID;
    this.clientSecret = process.env.EPIC_CLIENT_SECRET;
    this.epicApi = process.env.EPIC_API_URL;
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
        'Accept': 'application/json'
      }
    };

    try {
      const response = await axios.post(
        `${this.epicApi}/account/api/oauth/device_authorization`,
        data.toString(),
        config
      );

      if (response.status !== 200) {
        throw new Error(`Failed to start device flow: ${response.status} - ${response.data}`);
      }

      const result = response.data;
      this.deviceCode = result.device_code;
      this.userCode = result.user_code;
      this.verificationUri = result.verification_uri;
      this.expiresIn = result.expires_in;
      this.interval = result.interval;

      return {
        user_code: this.userCode,
        verification_uri: this.verificationUri,
        expires_in: this.expiresIn,
        interval: this.interval
      };
    } catch (error) {
      if (error.response) {
        throw new Error(`Failed to start device flow: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
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
        'Accept': 'application/json'
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
        'Accept': 'application/json'
      }
    };

    try {
      const response = await axios.get(
        `${this.epicApi}/account/api/oauth/accountInfo`,
        config
      );

      if (response.status === 200) {
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
        'Accept': 'application/json'
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
        'Accept': 'application/json'
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
        'Content-Type': 'application/json'
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
        'Accept': 'application/json'
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
