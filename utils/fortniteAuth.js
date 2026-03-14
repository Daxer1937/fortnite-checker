const axios = require('axios');

class FortniteAPIAuth {
  constructor() {
    // Working Fortnite API endpoints
    this.endpoints = {
      bearer: 'https://fortnite-public-service-prod.ol.epicgames.com',
      account: 'https://account-public-service-prod.ol.epicgames.com',
      shop: 'https://fortnite-api.com/v2'
    };
    
    // Public Fortnite API token
    this.fortniteToken = 'MzQ0NmNkNzI2OTRjNGE0NDU1NWZhYjA4NGRkMzhlZDc0';
    
    // Session storage
    this.sessions = new Map();
  }

  async generateExchangeCode() {
    // Generate a mock exchange code for demo purposes
    const code = Math.random().toString(36).substring(2, 15).toUpperCase();
    return {
      code: code,
      expires_in: 300,
      verification_uri: 'https://www.epicgames.com/id/activate'
    };
  }

  async getPublicCosmetics() {
    try {
      const response = await axios.get(`${this.endpoints.shop}/cosmetics/br`);
      return response.data.data || [];
    } catch (error) {
      console.log('Fortnite API fallback failed, using mock data');
      return this.getMockCosmetics();
    }
  }

  getMockCosmetics() {
    // Mock cosmetics data for demo
    return [
      {
        id: 'cid_028_athena_commando_m_halloween',
        name: 'Skull Trooper',
        type: 'skin',
        rarity: 'epic',
        description: 'Spooky skull soldier'
      },
      {
        id: 'cid_017_athena_commando_m_sunflower',
        name: 'Sunflower',
        type: 'skin', 
        rarity: 'uncommon',
        description: 'Bright sunflower warrior'
      },
      {
        id: 'pickaxe_id_042_holidayreeper',
        name: 'Candy Axe',
        type: 'pickaxe',
        rarity: 'rare',
        description: 'Sweet deadly weapon'
      }
    ];
  }

  async createSession(userId, username) {
    const session = {
      userId: userId,
      username: username,
      accessToken: 'mock_token_' + Date.now(),
      accountId: 'mock_account_' + userId,
      loggedIn: true,
      loginTime: Date.now(),
      cosmetics: await this.getPublicCosmetics()
    };
    
    this.sessions.set(userId, session);
    return session;
  }

  getSession(userId) {
    return this.sessions.get(userId);
  }

  async getBackupCodes(userId) {
    const session = this.getSession(userId);
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Mock backup codes for demo
    return [
      {
        id: 'backup_1',
        code: 'DEMO-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        created_at: new Date().toISOString(),
        active: true
      },
      {
        id: 'backup_2', 
        code: 'DEMO-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        created_at: new Date(Date.now() - 86400000).toISOString(),
        active: false
      }
    ];
  }

  async generateBackupCode(userId) {
    const session = this.getSession(userId);
    if (!session) {
      throw new Error('Not authenticated');
    }

    const newCode = {
      id: 'backup_' + Date.now(),
      code: 'DEMO-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      created_at: new Date().toISOString(),
      active: true
    };

    return newCode;
  }

  async deleteBackupCode(userId, codeId) {
    const session = this.getSession(userId);
    if (!session) {
      throw new Error('Not authenticated');
    }

    return { success: true, message: 'Backup code deleted' };
  }
}

module.exports = { FortniteAPIAuth };
