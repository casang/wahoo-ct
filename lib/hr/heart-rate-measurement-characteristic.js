var debugHRM = require('debug')('wahooCT:hrm');
var Bleno = require('bleno');

// Spec
//https://www.bluetooth.com/xml-viewer/?src=https://www.bluetooth.com/wp-content/uploads/Sitecore-Media-Library/Gatt/Xml/Services/org.bluetooth.service.heart_rate.xml

class HeartRateMeasurementCharacteristic extends  Bleno.Characteristic {
 
  constructor() {
    super({
      uuid: '2A37',
      value: null,
      properties: ['notify'],
      descriptors: [
        new Bleno.Descriptor({
					uuid: '2901',
					value: 'Heart Rate Measurement'
				}),
/*        new Bleno.Descriptor({
          // Client Characteristic Configuration
          uuid: '2902',
          value: Buffer.alloc(2)
        }),*/
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
    debugHRM('[HeartRateMeasurementCharacteristic] client subscribed to PM');
    this._updateValueCallback = updateValueCallback;
    return this.RESULT_SUCCESS;
  };

  onUnsubscribe() {
    debugHRM('[HeartRateMeasurementCharacteristic] client unsubscribed from PM');
    this._updateValueCallback = null;
    return this.RESULT_UNLIKELY_ERROR;
  };

  notify(event) {
    if (!('heartrate' in event))
      return this.RESULT_SUCCESS;

    var buffer = new Buffer(3);
      
    buffer.writeUInt8(0x01, 0); //Heart Rate Value Format is set to UINT16. Units: beats per minute (bpm)
    var hr = event.heartrate;
    debugHRM("heartRate: " + hr);
    buffer.writeInt16LE(hr, 1);
    if (this._updateValueCallback) {
      this._updateValueCallback(buffer);
    }
    return this.RESULT_SUCCESS;
  }
};

module.exports = HeartRateMeasurementCharacteristic;
