const assert = require('assert');
const t = require('../index');

const backgroundColor = '#c029ff';
const progressBarColor = '#00FF00';


it('#getParcelTrackingInfos', async function () {
  return t.getParcelTrackingInfos('DUMY-TRACKING-NUMBER').then(() => {
    assert.fail('Should not work with dummy tracking number');
  }).catch(err => {
    assert.ok(err);
  });
})

describe('QTracker', function () {
  const app = new t.QUPSTracker();
  app.geometry = {
    height: 1,
    width: 5,
    origin: {
      x: 1, y: 1
    }
  };


  it('#getColor', function () {
    assert.equal(progressBarColor, app.getColor(1, 3),
      'Expected to be progressBarColor if index < number of keys to light');
    assert.equal(backgroundColor, app.getColor(4, 2),
      'Expected to be backgroundColor if index >= number of keys to light');
  });
});