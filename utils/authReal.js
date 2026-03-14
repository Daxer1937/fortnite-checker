const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class EpicGamesAuthReal {
  constructor() {
    this.clientId = process.env.EPIC_CLIENT_ID;
    this.clientSecret = process.env.EPIC_CLIENT_SECRET;
    // Try different Epic Games endpoints
    this.endpoints = [
      'https://account-public-service-prod.ol.epicgames.com',
      'https://account-public-service-prod01.ol.epicgames.com',
      'https://account-public-service-prod02.ol.epicgames.com',
      'https://account-public-service.epicgames.com'
    ];
    this.currentEndpoint = null;
    this.deviceCode = null;
    this.userCode = null;
    this.verificationUri = "https://www.epicgames.com/id/activate";
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
    this.accountId = null;
  }

  async findWorkingEndpoint() {
    for (const endpoint of this.endpoints) {
      try {
        // Test with a simple request
        const response = await axios.get(`${endpoint}/account/api/oauth/authorize`, {
          timeout: 5000,
          headers: {
            'User-Agent': 'EpicGamesLauncher/11.0.1-15407791+++Portal+Release-11.0 Windows/11.10.0-15306973, branch:release',
            'Accept': 'application/json'
          }
        });
        
        if (response.status === 200 || response.status === 302) {
          this.currentEndpoint = endpoint;
          console.log(`✅ Found working endpoint: ${endpoint}`);
          return endpoint;
        }
      } catch (error) {
        console.log(`❌ Endpoint failed: ${endpoint} - ${error.message}`);
        continue;
      }
    }
    throw new Error('No working Epic Games endpoint found');
  }

  async startDeviceFlow() {
    if (!this.currentEndpoint) {
      await this.findWorkingEndpoint();
    }

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
        'User-Agent': 'EpicGamesLauncher/11.0.1-15407791+++Portal+Release-11.0 Windows/11.10.0-15306973, branch:release',
        'X-Epic-Client-Info': `{"client_id":"${this.clientId}","client_secret":"${this.clientSecret}"}`
      }
    };

    try {
      const response = await axios.post(
        `${this.currentEndpoint}/account/api/oauth/device_authorization`,
        data.toString(),
        config
      );

      if (response.status === 200) {
        const result = response.data;
        this.deviceCode = result.device_code;
        this.userCode = result.user_code;
        this.verificationUri = result.verification_uri || this.verificationUri;
        this.expiresIn = result.expires_in;
        this.interval = result.interval;

        return {
          user_code: this.userCode,
          verification_uri: this.verificationUri,
          expires_in: this.expiresIn,
          interval: this.interval
        };
      } else {
        throw new Error(`Device flow failed: ${response.status} - ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      if (error.response) {
        console.log('Device flow error response:', error.response.status, error.response.data);
        throw new Error(`Device flow failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
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
        'Accept': 'application/json',
        'User-Agent': 'EpicGamesLauncher/11.0.1-15407791+++Portal+Release-11.0 Windows/11.10.0-15306973, branch:release'
      }
    };

    try {
      const response = await axios.post(
        `${this.currentEndpoint}/account/api/oauth/token`,
        data.toString(),
        config
      );

      if (response.status === 200) {
        const result = response.data;
        this.accessToken = result.access_token;
        this.refreshToken = result.refresh_token;
        this.expiresAt = Date.now() + (result.expires_in * 1000);
        console.log('✅ Successfully got Epic Games token!');
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
        console.log('Token error response:', error.response.status, error.response.data);
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
        'User-Agent': 'EpicGamesLauncher/11.0.1-15407791+++Portal+Release-11.0 Windows/11.10.0-15306973, branch:release'
      }
    };

    try {
      const response = await axios.get(
        `${this.currentEndpoint}/account/api/oauth/accountInfo`,
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
        'User-Agent': 'EpicGamesLauncher/11.0.1-15407791+++Portal+Release-11.0 Windows/11.10.0-15306973, branch:release'
      }
    };

    try {
      const response = await axios.post(
        `${this.currentEndpoint}/account/api/oauth/token`,
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
        'User-Agent': 'EpicGamesLauncher/11.0.1-15407791+++Portal+Release-11.0 Windows/11.10.0-15306973, branch:release'
      }
    };

    try {
      console.log(`🔍 Fetching real backup codes from: ${this.currentEndpoint}/account/api/public/account/${this.accountId}/backupCodes`);
      
      const response = await axios.get(
        `${this.currentEndpoint}/account/api/public/account/${this.accountId}/backupCodes`,
        config
      );

      if (response.status === 200) {
        console.log('✅ Successfully got real backup codes!');
        return response.data;
      } else {
        throw new Error(`Failed to get backup codes: ${response.status}`);
      }
    } catch (error) {
      if (error.response) {
        console.log('Backup codes error response:', error.response.status, error.response.data);
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
        'User-Agent': 'EpicGamesLauncher/11.0.1-15407791+++Portal+Release-11.0 Windows/11.10.0-15306973, branch:release'
      }
    };

    try {
      console.log(`🔍 Generating real backup code at: ${this.currentEndpoint}/account/api/public/account/${this.accountId}/backupCodes`);
      
      const response = await axios.post(
        `${this.currentEndpoint}/account/api/public/account/${this.accountId}/backupCodes`,
        {},
        config
      );

      if (response.status === 200) {
        console.log('✅ Successfully generated real backup code!');
        return response.data;
      } else {
        throw new Error(`Failed to generate backup code: ${response.status}`);
      }
    } catch (error) {
      if (error.response) {
        console.log('Generate backup code error response:', error.response.status, error.response.data);
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
        'User-Agent': 'EpicGamesLauncher/11.0.1-15407791+++Portal+Release-11.0 Windows/11.10.0-15306973, branch:release'
      }
    };

    try {
      console.log(`🔍 Deleting real backup code at: ${this.currentEndpoint}/account/api/public/account/${this.accountId}/backupCodes/${codeId}`);
      
      const response = await axios.delete(
        `${this.currentEndpoint}/account/api/public/account/${this.accountId}/backupCodes/${codeId}`,
        config
      );

      if (response.status === 200) {
        console.log('✅ Successfully deleted real backup code!');
        return response.data;
      } else {
        throw new Error(`Failed to delete backup code: ${response.status}`);
      }
    } catch (error) {
      if (error.response) {
        console.log('Delete backup code error response:', error.response.status, error.response.data);
        throw new Error(`Failed to delete backup code: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }
}

module.exports = { EpicGamesAuthReal };
