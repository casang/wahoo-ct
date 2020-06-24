var debugCSC = require('debug')('wahooCT:csc');
var Bleno = require('bleno');

// Spec
//https://www.bluetooth.com/xml-viewer/?src=https://www.bluetooth.com/wp-content/uploads/Sitecore-Media-Library/Gatt/Xml/Characteristics/org.bluetooth.characteristic.csc_measurement.xml

class CyclingSpeedCadenceMeasurementCharacteristic extends  Bleno.Characteristic {
 
  constructor() {
    super({
      uuid: '2A5B',
      value: null,
      properties: ['notify'],
      descriptors: [
        new Bleno.Descriptor({
					uuid: '2901',
					value: 'Cycling Speed Cadence Measurement'
				}),
        new Bleno.Descriptor({
          // Client Characteristic Configuration
          uuid: '2902',
          value: Buffer.alloc(2)
        }),
        new Bleno.Descriptor({
          // Server Characteristic Configuration
          uuid: '2903',
          value: Buffer.alloc(2)
        })
      ]
    });
    this._updateValueCallback = null;  
  }

  onSubscribe(maxValueSize, updateValueCallback) {
    debugCSC('[CyclingSpeedCadenceMeasurementCharacteristic] client subscribed to PM');
    this._updateValueCallback = updateValueCallback;
    return this.RESULT_SUCCESS;
  };

  onUnsubscribe() {
    debugCSC('[CyclingSpeedCadenceMeasurementCharacteristic] client unsubscribed from PM');
    this._updateValueCallback = null;
    return this.RESULT_UNLIKELY_ERROR;
  };

  notify(event) {
    if (!('crankRev' in event)) {
      // ignore events with crank data
      return this.RESULT_SUCCESS;
    }
    var buffer = new Buffer(5);
    buffer.writeUInt8(0x02, 0); //Wheel Revolution Data Present

    debugCSC("crankrev: " + event.crankRev);
    buffer.writeUInt16LE(event.crankRev, 1);
    buffer.writeUInt16LE(event.crankTime, 3);

    if (this._updateValueCallback) {
      this._updateValueCallback(buffer);
    }
    return this.RESULT_SUCCESS;
  }  
};

module.exports = CyclingSpeedCadenceMeasurementCharacteristic;
