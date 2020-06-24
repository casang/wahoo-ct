const Bleno = require('bleno');
const debugHRM = require('debug')('csc');

const CyclingSpeedCadenceMeasurementCharacteristic = require('./cycling-speed-cadence-measurement-characteristic');
const StaticReadCharacteristic = require('../read-characteristic');

//https://www.bluetooth.com/xml-viewer/?src=https://www.bluetooth.com/wp-content/uploads/Sitecore-Media-Library/Gatt/Xml/Services/org.bluetooth.service.cycling_speed_and_cadence.xml

class CyclingSpeedCadenceService extends Bleno.PrimaryService {

  constructor() {
    let cyclingSpeedCadenceMeasurement = new CyclingSpeedCadenceMeasurementCharacteristic();
    super({
        uuid: '1816',
        characteristics: [
          cyclingSpeedCadenceMeasurement,
          new StaticReadCharacteristic('2A5C', 'Cycling SpeedCadence Feature', [0x02, 0x00]), // 0x02 - crank revolutions
          //new StaticReadCharacteristic('2A5D', 'Sensor Location', [13]),        // 13 = rear hub
       ]
    });

    this.cyclingSpeedCadenceMeasurement = cyclingSpeedCadenceMeasurement;
  }

  notify(event) {
    this.cyclingSpeedCadenceMeasurement.notify(event);
    return this.RESULT_SUCCESS;
  };

}
  
module.exports = CyclingSpeedCadenceService;
