const Bleno = require('bleno');
const debugFEC = require('debug')('fec');

const CyclingPowerMeasurementCharacteristic = require('./cycling-power-measurement-characteristic');
const StaticReadCharacteristic = require('../read-characteristic');

class StaticNotifyCharacteristic extends Bleno.Characteristic {
	constructor(uuid, description) {
		super({
			uuid: uuid,
			properties: ['notify'],
			//value: Buffer.isBuffer(value) ? value : new Buffer.from(value),
			//descriptors: [
			//	new Bleno.Descriptor({
			//		uuid: '2901',
			//		value: description
			//	})
			//]
		});
		this.uuid = uuid;
		this.description = description;
		//this.value = Buffer.isBuffer(value) ? value : new Buffer(value);
	}
	
	onNotify() {
		debugFEC('[FEC] received notify:');
		writeCallback (Bleno.Characteristic.RESULT_SUCCESS);
	  };
}

class StaticIndicateCharacteristic extends Bleno.Characteristic {
	constructor(uuid, description) {
		let prcCT = null;
	
		super({
			uuid: uuid,
			properties: ['indicate', 'write'],
		});
		this.uuid = uuid;
		this.description = description;
	}
	
	onIndicate (){
		debugFEC('[FEC] onIndicate:');
		writeCallback (Bleno.Characteristic.RESULT_SUCCESS);
	  };

	onWriteRequest(data, offset, withoutResponse, writeCallback) {
		debugFEC('[FEC] OnWriteRequest:', data);
		var grade = 0;
		if (data[0] == 0x43){
		  if (data[1] == 0x6c){
			  //rouvy
			grade = data[6] * 256 + data[5];
			grade = ((grade - 293) * 75) / 124;
			debugFEC('[FEC] grade:', data[6]);
			debugFEC('[FEC] grade:', data[5]);
			debugFEC('[FEC] grade:', grade);
			this.grade = grade;
			if (this.prcCT != null){
				this.prcCT.send ({grade: this.grade});
			}
		  }
		}
		if (data[0] == 0x46){
			//zwift
			grade = data[2] * 256 + data[1];
			grade = (grade - 0x8000) / 10;
			debugFEC('[FEC] grade:', data[2]);
			debugFEC('[FEC] grade:', data[1]);
			debugFEC('[FEC] grade:', grade);
			this.grade = grade;
			if (this.prcCT != null){
				this.prcCT.send ({grade: this.grade});
			}
		}
		writeCallback (Bleno.Characteristic.RESULT_SUCCESS);
	  };

	onNotify() {
		debugFEC('[FEC] onNotify:');
		writeCallback (Bleno.Characteristic.RESULT_SUCCESS);
	  };

	setCT (prcCT){
		this.prcCT = prcCT;
	  }
	
}
// https://developer.bluetooth.org/gatt/services/Pages/ServiceViewer.aspx?u=org.bluetooth.service.cycling_power.xml
class CyclingPowerService extends Bleno.PrimaryService {

  constructor() {
	let powerMeasurement = new CyclingPowerMeasurementCharacteristic();
	let trainner = new StaticIndicateCharacteristic('A026E0050A7D4AB397FAF1500F9FEB8B', 'Wahoo Trainer');
	let grade = 0;
	let prcCT = null;
    super({
        //uuid: '1818',
        uuid: '00001818-0000-1000-8000-00805F9B34FB',
        //uuid: '6E40FEC1-B5A3-F393-E0A9-E50E24DCCA9E',
        characteristics: [
          powerMeasurement,
          //new StaticReadCharacteristic('2A65', 'Cycling Power Feature', [0x08, 0, 0, 0]), // 0x08 - crank revolutions
          new StaticReadCharacteristic('2A65', 'Cycling Power Feature', [0, 0, 0, 0]),
          //new StaticReadCharacteristic('2A5D', 'Sensor Location', [13]),        // 13 = rear hub
		  trainner,
        ]
    });

	this.powerMeasurement = powerMeasurement;
	this.trainner = trainner;
  }

  notify(event) {
    this.powerMeasurement.notify(event);
    return this.RESULT_SUCCESS;
  };
  
  setCT (prcCT){
	this.prcCT = prcCT;
	this.trainner.setCT (prcCT);
  }
}
  
module.exports = CyclingPowerService;
