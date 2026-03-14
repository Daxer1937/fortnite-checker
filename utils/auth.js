const axios = require('axios');

class EpicGamesAuth {
  constructor() {
    // Use the exact credentials from the documentation example
    this.clientId = 'ec684b8c687f479fadea3cb2ad83f5c6';
    this.clientSecret = 'e1f31c211f28413186262d37a13fc84d';
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
      responseType: 'code'
    });

    return `https://www.epicgames.com/id/api/redirect?${params.toString()}`;
  }

  async exchangeCodeForToken(authorizationCode) {
    const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const data = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authorizationCode,
      token_type: 'eg1'
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
      console.log(`🔄 Exchanging code: ${authorizationCode}`);
      console.log(`🔄 Request data: ${data.toString()}`);
      console.log(`🔄 Basic auth: ${basicAuth.substring(0, 20)}...`);
      console.log(`🔄 Expected basic auth: ZWM2ODRiOGM2ODdmNDc5ZmFkZWEzY2IyYWQ4M2Y1YzY6ZTFmMzFjMjExZjI4NDEzMTg2MjYyZDM3YTEzZmM4NGQ=`);
      
      const response = await axios.post(
        `${this.epicApi}/account/api/oauth/token`,
        data.toString(),
        config
      );

      console.log(`🔄 Response status: ${response.status}`);
      console.log(`🔄 Response data:`, response.data);

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
      console.error('🔄 Token exchange error:', error.response?.data || error.message);
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

    // Since Epic Games doesn't provide backup codes through API, return demo codes
    console.log('🔄 Epic Games API doesn\'t support backup codes, returning demo codes');
    
    return [
      {
        code: 'DEMO-ABC12345',
        active: true,
        created_at: new Date().toISOString(),
        id: 'demo-1'
      },
      {
        code: 'DEMO-XYZ67890',
        active: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        id: 'demo-2'
      }
    ];
  }

  async generateBackupCode() {
    if (!this.accessToken || !this.accountId) {
      throw new Error('Not authenticated - need user account access');
    }

    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }

    // Since Epic Games doesn't provide backup codes through API, generate demo code
    console.log('🔄 Epic Games API doesn\'t support backup codes, generating demo code');
    
    const randomCode = 'DEMO-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    
    return {
      code: randomCode,
      active: true,
      created_at: new Date().toISOString(),
      id: 'demo-' + Date.now()
    };
  }

  async deleteBackupCode(codeId) {
    if (!this.accessToken || !this.accountId) {
      throw new Error('Not authenticated - need user account access');
    }

    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }

    // Since Epic Games doesn't provide backup codes through API, simulate deletion
    console.log(`🔄 Epic Games API doesn\'t support backup codes, simulating deletion of ${codeId}`);
    
    return { success: true, message: 'Demo backup code deleted successfully' };
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
