'use strict'

const bleno = require('bleno');
const EventEmitter = require('events');

const debugBLE = require('debug')('ble');
const debugCSP = require('debug')('csp');
const debugFEC = require('debug')('fec');
const debugHRM = require('debug')('hrm');
const debugCSC = require('debug')('csc');

const DeviceInformationService = require('./dis/device-information-service');
const CyclingPowerService = require('./cps/cycling-power-service');
const HeartRateService = require('./hr/heart-rate-service');
const CyclingSpeedCadenceService = require('./csc/cycling-speed-cadence-service');
//const Computrainner = require('computra');

class wahooCTBLE extends EventEmitter {

	constructor(options) {
		super();

		this.name = options.name || "Wahoo KIKR";
		process.env['BLENO_DEVICE_NAME'] = this.name;

		this.csp = new CyclingPowerService();
		this.dis = new DeviceInformationService(options);
		this.hrm = new HeartRateService();
		this.csc = new CyclingSpeedCadenceService();

		let self = this;
		let procCT = null;

		bleno.on('stateChange', (state) => {
			debugBLE(`[${this.name} stateChange] new state: ${state}`);
			
			self.emit('stateChange', state);

			if (state === 'poweredOn') {

				bleno.startAdvertising(self.name, [
					self.dis.uuid,
					self.csp.uuid,
					self.hrm.uuid,
					self.csc.uuid,
				]);

			} else {

				debugBLE('Stopping...');
				bleno.stopAdvertising();

			}
		});

		bleno.on('advertisingStart', (error) => {
			debugBLE(`[${this.name} advertisingStart] ${(error ? 'error ' + error : 'success')}`);
			self.emit('advertisingStart', error);

			if (!error) {
				bleno.setServices([
					self.dis,
					self.csp,
					self.hrm,
					self.csc,
				], 
				(error) => {
					debugBLE(`[${this.name} setServices] ${(error ? 'error ' + error : 'success')}`);
				});
			}
		});

		bleno.on('advertisingStartError', () => {
			debugBLE(`[${this.name} advertisingStartError] advertising stopped`);
			self.emit('advertisingStartError');
		});

		bleno.on('advertisingStop', error => {
			debugBLE(`[${this.name} advertisingStop] ${(error ? 'error ' + error : 'success')}`);
			self.emit('advertisingStop');
		});

		bleno.on('servicesSet', error => {
			debugBLE(`[${this.name} servicesSet] ${ (error) ? 'error ' + error : 'success'}`);
		});

		bleno.on('accept', (clientAddress) => {
			debugBLE(`[${this.name} accept] Client: ${clientAddress}`);
			self.emit('accept', clientAddress);
			bleno.updateRssi();
		});

		bleno.on('rssiUpdate', (rssi) => {
			debugBLE(`[${this.name} rssiUpdate]: ${rssi}`);
		});

		// start the ping
		//this.ping();
	}
	
	setCT (prcCT){
		this.prcCT = prcCT;
		this.csp.setCT (prcCT);
	}

	notifyCSC(event) {
		debugCSC(`[${this.name} notifyCSC] ${JSON.stringify(event)}`);

		this.csc.notify(event);

		if (!('crankRev' in event)) {
			debugCSP("[" + this.name +" notify] unrecognized event: %j", event);
		} 
	}
	
	notifyCSP(event) {
		debugCSP(`[${this.name} notifyCSP] ${JSON.stringify(event)}`);

		this.csp.notify(event);

		if (!('power' in event)) {
			debugCSP("[" + this.name +" notify] unrecognized event: %j", event);
		}
	};

	notifyHRM(event) {
		debugHRM(`[${this.name} notifyHRM] ${JSON.stringify(event)}`);

		this.hrm.notify(event);
	};

	ping() {
		const TIMEOUT = 4000;
		let self = this;

		setTimeout(() => {
			// send a zero event if we don't hear for 4 seconds (15 rpm)
			if (Date.now() - self.last_timestamp > TIMEOUT) {
				/*self.notifyCSP({
					'heart_rate': 0,
					'watts': 0,
					'rev_count': self.rev_count
				})*/
			}
			this.ping();
		}, TIMEOUT);
	}

};

module.exports = wahooCTBLE;
