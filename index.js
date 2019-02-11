const request = require('request-promise');
const q = require('daskeyboard-applet');
const logger = q.logger;
const trackingBaseUrl = 'https://www.ups.com/track/api/Track/GetStatus?loc=en_US';

const STATUS_TYPES = ['D', 'P', 'M', 'I'];

class UPSTrackingInfos {
  constructor(responseJSON = {}) {
    if (responseJSON.trackDetails && responseJSON.trackDetails.length > 0) {
      this.packageStatus = responseJSON.trackDetails[0].packageStatus;
      this.progressBarPercentage = responseJSON.trackDetails[0].progressBarPercentage;
      this.packageStatusType = responseJSON.trackDetails[0].packageStatusType;
    }
  }
}

/**
 * Given a tracking number.
 * Get tracking information from the UPS API
 * @param {*} trackingNumber 
 */
async function getUPSTrackingInfos(trackingNumber) {
  const options = {
    method: 'POST',
    uri: trackingBaseUrl,
    body: {
      Locale: "en_US",
      TrackingNumber: [
        `${trackingNumber}`
      ]
    },
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36'
    },
    json: true
  }

  return request(options).then(response => {
    return new UPSTrackingInfos(response);
  });
}



class QUPSTracker extends q.DesktopApp {
  constructor() {
    super();
    // run every 30 minutes
    this.pollingInterval = 60 * 1000 * 30;
  }

  generatePoints(percent) {
    logger.info(`Generating points for tracking percentage ${percent}`);
    // multiply the cpu percentage by the number total of keys
    const numberOfKeysToLight = Math.round(this.getWidth() * +percent / 100);
    logger.info(`Will light ${numberOfKeysToLight} keys`);
    let points = [];

    // create a list of points (zones) with a color). Each point 
    // correspond to an LED
    for (let i = 0; i < this.getWidth(); i++) {
      // if percentage is 100 BLINK
      if (percent === 100) {
        points.push(new q.Point(this.getColor(i, numberOfKeysToLight), q.Effects.BLINK));
      } else {
        // SET_COLOR only
        points.push(new q.Point(this.getColor(i, numberOfKeysToLight)));
      }
    }

    return points;
  }

  /** Get color of a point depending on its index in the bargraph and the 
   * number of keys to light
   */
  getColor(index, numberOfKeysToLight) {
    const progressBarColor = this.config.progressColor || '#00FF00';
    const backgroundColor = this.config.backgroundColor || '#FFFF00';
    if (index >= numberOfKeysToLight) {
      return backgroundColor;
    } else {
      return progressBarColor;
    }
  }

  async run() {
    const trackingNumber = this.config.trackingNumber;
    if (!trackingNumber) {
      logger.error(`No tracking number found in configuration`);
      return;
    }
    return getUPSTrackingInfos(trackingNumber).then(upsStatus => {
      let points = [];
      const signalTitle = `UPS package tracker`;
      let message = '';

      /*
       * If a percentage is provided. Generate the points like a bar graph.
       * Other wise color the applet in white
       */
      if (upsStatus.progressBarPercentage
        || STATUS_TYPES.includes(upsStatus.packageStatusType)) {
        points = this.generatePoints(+upsStatus.progressBarPercentage);
      } else {
        const numberOfKeysToLight = this.getWidth();
        for (let i = 0; i < numberOfKeysToLight; i++) {
          points.push(new q.Point('#FFFFFF'));
        }
      }
      if (upsStatus.packageStatus) {
        message = upsStatus.packageStatus;
      } else {
        message = `Applet cannot resolve delivery status`;
      }

      message = `<div>${message}</div><br><div>${this.config.trackingNumber}</div>`
      return new q.Signal({
        points: [points],
        name: signalTitle,
        message: message,
        link: {
          url: `https://www.ups.com/track?loc=en_US&tracknum=${this.config.trackingNumber}&requester=WT/trackdetails`,
          label: `Show in UPS`
        }
      })

    }).catch(err => {
      logger.error(`Error when getting UPS Tracking infos ${err}`);
      return q.Signal.error([`The UPS service returned an error. Please contact the applet author.`,
        `Detail: ${err}`]);
    })
  }
}



const tracker = new QUPSTracker();


module.exports = {
  QUPSTracker: QUPSTracker
}









