const q = require('daskeyboard-applet');
const tracker = require('track-my-parcel');
const logger = q.logger;

/**
 * Given a tracking number.
 * Get tracking information from the UPS API
 * @param {*} trackingNumber 
 */
async function getUPSTrackingInfos(trackingNumber) {
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
    const progressBarColor = '#00FF00';
    const backgroundColor = '#FFFF00';
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
      if (upsStatus.statusPercentage) {
        points = this.generatePoints(+upsStatus.statusPercentage);
      } else {
        const numberOfKeysToLight = this.getWidth();
        for (let i = 0; i < numberOfKeysToLight; i++) {
          points.push(new q.Point('#FFFFFF'));
        }
      }
      if (upsStatus.statusLabel) {
        message = upsStatus.statusLabel;
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



const parcelTracker = new QTracker();


module.exports = {
  QUPSTracker: QTracker
}









