const axios = require('axios');

class FortniteAPIAuth {
  constructor() {
    this.apiKey = process.env.FORTNITE_API_KEY || '';
    this.baseUrl = 'https://fortnite-api.com/v2';
  }

  async getUserCosmetics(username) {
    try {
      const response = await axios.get(`${this.baseUrl}/cosmetics/br/search`, {
        params: {
          name: username
        },
        headers: {
          'Authorization': this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Fortnite API error: ${error.message}`);
    }
  }
}

module.exports = { FortniteAPIAuth };
