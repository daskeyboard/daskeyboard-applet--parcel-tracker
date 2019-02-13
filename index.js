const q = require('daskeyboard-applet');
const tracker = require('track-my-parcel');
const logger = q.logger;

/**
 * Given a tracking number.
 * Get tracking information from the UPS API
 * @param {*} trackingNumber 
 */
async function getParcelTrackingInfos(trackingNumber) {
  return new Promise((resolve, reject) => {
    tracker.Track(trackingNumber, (infos, err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(infos);
    })
  });
}

class QTracker extends q.DesktopApp {
  constructor() {
    super();
    // run every 10 minutes
    this.pollingInterval = 60 * 1000 * 10;
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
    const progressBarColor = '#00FF00'; // Green
    const backgroundColor = '#c029ff'; // Purple
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
    return getParcelTrackingInfos(trackingNumber).then(trackingInfo => {
      logger.info(`Got tracking info ${JSON.stringify(trackingInfo)}`);
      let points = [];
      const signalTitle = `Parcel tracker`;
      let message = '';

      /*
       * If a percentage is provided. Generate the points like a bar graph.
       * Other wise color the applet in white
       */
      points = this.generatePoints(+trackingInfo.statusPercentage);
      if (trackingInfo.statusLabel) {
        message = trackingInfo.statusLabel;
      } else {
        message = `Applet cannot resolve delivery status`;
      }

      message = `${this.config.trackingContent ? this.config.trackingContent + ':': ''}`
        + `<div>${message}</div>`
        + `<br>${trackingInfo.carrierName}`
        + `<br>${this.config.trackingNumber}`;

      // build the link for more info if available
      let link;
      if (trackingInfo.detailsLink) {
        link = {
          url: trackingInfo.detailsLink,
          label: `Show more information`
        }
      }
      return new q.Signal({
        points: [points],
        name: signalTitle,
        message: message,
        link: link
      });

    }).catch(err => {
      logger.error(`Error when getting parcel tracking infos ${err}`);
      return q.Signal.error([`The parcel tracker returned an error. Please contact the applet author.`,
        `Detail: ${err}`]);
    })
  }
}



const parcelTracker = new QTracker();


module.exports = {
  QUPSTracker: QTracker,
  getParcelTrackingInfos: getParcelTrackingInfos
}









