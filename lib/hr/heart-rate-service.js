const Bleno = require('bleno');
const debugHRM = require('debug')('hrm');

const HeartRateMeasurementCharacteristic = require('./heart-rate-measurement-characteristic');

//https://www.bluetooth.com/xml-viewer/?src=https://www.bluetooth.com/wp-content/uploads/Sitecore-Media-Library/Gatt/Xml/Services/org.bluetooth.service.heart_rate.xm

class HeartrateService extends Bleno.PrimaryService {

  constructor() {
    let heartRateMeasurement = new HeartRateMeasurementCharacteristic();
    super({
        uuid: '180D',
        characteristics: [
          heartRateMeasurement,
        ]
    });

    this.heartRateMeasurement = heartRateMeasurement;
  }

  notify(event) {
    this.heartRateMeasurement.notify(event);
    return this.RESULT_SUCCESS;
  };

}
  
module.exports = HeartrateService;
