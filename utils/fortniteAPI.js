const axios = require('axios');
const { EpicGamesAuth } = require('./auth');

class FortniteAPI {
  constructor(auth) {
    this.auth = auth;
    this.fortniteApi = 'https://fortnite-public-service-prod.ol.epicgames.com';
    this.fortniteToken = 'MzQ0NmNkNzI2OTRjNGE0NDU1NWZhYjA4NGRkMzhlZDc0';
  }

  async getProfileCosmetics(accountId) {
    await this.auth.ensureValidToken();

    const config = {
      headers: {
        'Authorization': `bearer ${this.auth.accessToken}`,
        'X-Epic-Games-SDK-Key': this.fortniteToken,
        'Accept': 'application/json'
      }
    };

    try {
      const response = await axios.get(
        `${this.fortniteApi}/fortnite/api/game/v2/profile/${accountId}/client/QueryProfile?profileId=campaign&rvn=-1`,
        config
      );

      if (response.status === 200) {
        const profile = response.data;
        return this.extractCosmetics(profile);
      } else {
        throw new Error(`Failed to get profile: ${response.status}`);
      }
    } catch (error) {
      if (error.response) {
        throw new Error(`Failed to get profile: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  extractCosmetics(profile) {
    const cosmetics = [];
    const profileData = profile.profileChanges?.[0]?.profile;

    if (!profileData) {
      return cosmetics;
    }

    const items = profileData.items || {};
    
    for (const [itemId, item] of Object.entries(items)) {
      if (item.templateId && item.attributes) {
        const cosmetic = {
          id: itemId,
          templateId: item.templateId,
          name: item.attributes.name || 'Unknown',
          rarity: item.attributes.rarity || 'Common',
          type: this.getCosmeticType(item.templateId),
          exclusive: item.attributes.favorite || false,
          variants: item.variants || []
        };
        cosmetics.push(cosmetic);
      }
    }

    return cosmetics;
  }

  getCosmeticType(templateId) {
    if (templateId.includes('AthenaCharacter')) return 'skins';
    if (templateId.includes('AthenaPickaxe')) return 'pickaxes';
    if (templateId.includes('AthenaGlider')) return 'gliders';
    if (templateId.includes('AthenaDance')) return 'emotes';
    if (templateId.includes('AthenaItemWrap')) return 'wraps';
    if (templateId.includes('AthenaBackpack')) return 'backpacks';
    if (templateId.includes('AthenaSkydiveContrail')) return 'contrails';
    if (templateId.includes('AthenaMusicPack')) return 'music';
    if (templateId.includes('AthenaLoadingScreen')) return 'loading_screens';
    if (templateId.includes('AthenaSpray')) return 'sprays';
    if (templateId.includes('AthenaEmoji')) return 'emojis';
    if (templateId.includes('AthenaToy')) return 'toys';
    return 'other';
  }

  categorizeCosmetics(cosmetics) {
    const categories = {
      all: cosmetics,
      skins: [],
      pickaxes: [],
      gliders: [],
      emotes: [],
      backpacks: [],
      wraps: [],
      contrails: [],
      music: [],
      loading_screens: [],
      sprays: [],
      emojis: [],
      toys: [],
      other: []
    };

    for (const cosmetic of cosmetics) {
      if (categories[cosmetic.type]) {
        categories[cosmetic.type].push(cosmetic);
      } else {
        categories.other.push(cosmetic);
      }
    }

    return categories;
  }

  async getOwnedCosmetics() {
    if (!this.auth.accountId) {
      throw new Error('No account ID available');
    }

    return await this.getProfileCosmetics(this.auth.accountId);
  }
}

module.exports = { FortniteAPI };
