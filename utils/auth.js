const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class EpicGamesAuth {
  constructor() {
    this.clientId = process.env.EPIC_CLIENT_ID;
    this.clientSecret = process.env.EPIC_CLIENT_SECRET;
    this.epicApi = 'https://account-public-service-prod.ol.epicgames.com';
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
    this.accountId = null;
  }

  async authenticate() {
    // Use client_credentials grant type (from documentation)
    const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const data = new URLSearchParams({
      grant_type: 'client_credentials'
    });

    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Basic ${basicAuth}`,
        'User-Agent': 'EpicGamesLauncher/11.0.1-15407791+++Portal+Release-11.0 Windows/11.10.0-15306973, branch:release'
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
        this.expiresAt = new Date(result.expires_at).getTime();
        console.log('✅ Successfully authenticated with Epic Games!');
        return true;
      } else {
        throw new Error(`Authentication failed: ${response.status}`);
      }
    } catch (error) {
      if (error.response) {
        throw new Error(`Authentication failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  async getBackupCodes() {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    if (this.isTokenExpired()) {
      await this.authenticate();
    }

    const config = {
      headers: {
        'Authorization': `bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'EpicGamesLauncher/11.0.1-15407791+++Portal+Release-11.0 Windows/11.10.0-15306973, branch:release'
      }
    };

    try {
      // Use Epic Account Services endpoint for backup codes
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

    if (this.isTokenExpired()) {
      await this.authenticate();
    }

    const config = {
      headers: {
        'Authorization': `bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'EpicGamesLauncher/11.0.1-15407791+++Portal+Release-11.0 Windows/11.10.0-15306973, branch:release'
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

    if (this.isTokenExpired()) {
      await this.authenticate();
    }

    const config = {
      headers: {
        'Authorization': `bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'EpicGamesLauncher/11.0.1-15407791+++Portal+Release-11.0 Windows/11.10.0-15306973, branch:release'
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

  isTokenExpired() {
    return !this.expiresAt || Date.now() >= this.expiresAt;
  }
}

module.exports = { EpicGamesAuth };
