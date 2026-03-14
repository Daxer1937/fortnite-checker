const axios = require('axios');

class EpicGamesAuth {
  constructor() {
    // Use the actual Fortnite client credentials from documentation
    this.clientId = 'xyza7891343Fr4ZSPkQZ3kaL3I2sX8B5';
    this.clientSecret = 'F8BVRyHIqmct8cN9KSPbXsJszpiIZEYEFDiySxc1wuA';
    this.epicApi = 'https://account-public-service-prod.ol.epicgames.com';
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
    this.accountId = null;
    this.displayName = null;
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

  async getAuthUrl() {
    // Generate Epic Games authorization URL for user login
    const params = new URLSearchParams({
      clientId: this.clientId,
      responseType: 'code',
      scope: 'basic_profile friends presence openid viewbackupcodes'
    });

    return `https://www.epicgames.com/id/api/redirect?${params.toString()}`;
  }

  async exchangeCodeForToken(authorizationCode) {
    const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const data = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authorizationCode
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
        this.refreshToken = result.refresh_token;
        this.expiresAt = new Date(result.expires_at).getTime();
        this.accountId = result.account_id;
        this.displayName = result.displayName;
        console.log('✅ Successfully exchanged code for token!');
        return true;
      } else {
        throw new Error(`Token exchange failed: ${response.status}`);
      }
    } catch (error) {
      if (error.response) {
        throw new Error(`Token exchange failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  async getBackupCodes() {
    if (!this.accessToken || !this.accountId) {
      throw new Error('Not authenticated - need user account access');
    }

    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
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
    if (!this.accessToken || !this.accountId) {
      throw new Error('Not authenticated - need user account access');
    }

    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
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
    if (!this.accessToken || !this.accountId) {
      throw new Error('Not authenticated - need user account access');
    }

    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
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

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const data = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken
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
        console.log('✅ Successfully refreshed token!');
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

  isTokenExpired() {
    return !this.expiresAt || Date.now() >= this.expiresAt;
  }
}

module.exports = { EpicGamesAuth };
