const request = require('request-promise');

const trackingBaseUrl = 'https://www.ups.com/track/api/Track/GetStatus?loc=en_US';


class UPSTrackingInfos {
  constructor(responseJSON = {}) {
    console.log(responseJSON);
    if (responseJSON.trackDetails && responseJSON.trackDetails.length > 0) {
      this.packageStatus = responseJSON.trackDetails[0].packageStatus;
      this.progressBarPercentage = responseJSON.trackDetails[0].progressBarPercentage;
    }
  }
}

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
  console.log('sldfkj', options);

  return request(options).then(response => {
    return new UPSTrackingInfos(response);
  });
}

getUPSTrackingInfos('1ZXA13670394643568').then(upsStatus => {
  console.log('lsdkfj', upsStatus);

}).catch(err => {
  console.error(err);
})









