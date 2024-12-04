const NodeHelper = require('node_helper');

module.exports = NodeHelper.create({
  start: function() {
    this.config = null;
    this.forecastUrl = '';
    console.log("MMM-YrThen: Starting helper for MMM-YrThen");
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === 'GET_YRTHEN_FORECAST') {
      this.config = payload.config;
      this.forecastUrl = payload.forecastUrl;
      if (!this.forecastUrl) {
        console.error('MMM-YrThen: forecastUrl is required');
        return;
      }
      this.getForecastFromYrThen();
    }
  },

  async getForecastFromYrThen() {
    try {
      const https = require('https'); // Use require instead of dynamic import
      const options = {
        method: 'GET',
        hostname: new URL(this.forecastUrl).hostname,
        path: new URL(this.forecastUrl).pathname,
        headers: {
          'User-Agent': `MagicMirror/${this.config.version}` // Add module version to User-Agent
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const locationData = { forecast: JSON.parse(data) };
            this.sendSocketNotification('YRTHEN_FORECAST_DATA', locationData);
          } catch (error) {
            console.error(`MMM-YrThen: Error parsing JSON response: ${error}`);
            this.sendSocketNotification('YRTHEN_FORECAST_ERROR', error);
          }
        });
      });

      req.on('error', (error) => {
        console.error(`MMM-YrThen: Error fetching forecast: ${error}`);
        this.sendSocketNotification('YRTHEN_FORECAST_ERROR', error);
      });

      req.end();
    } catch (error) {
      console.error(`MMM-YrThen: Error fetching forecast: ${error}`);
      this.sendSocketNotification('YRTHEN_FORECAST_ERROR', error);
    }
  }
});
