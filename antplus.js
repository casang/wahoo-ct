'use strict';

const debugCSC = require('debug')('csc');

const Ant = require('/home/pi/ant-plus');
const stick = new Ant.GarminStick2();
const heartRateSensor = new Ant.HeartRateSensor(stick);
const speedCadenceSensor = new Ant.SpeedCadenceSensor(stick);
speedCadenceSensor.setWheelCircumference(2.120); //Wheel circumference in meters

heartRateSensor.on('hbData', data => {
  var hr = data.ComputedHeartRate;
  debugCSC(`heart rate: ${hr}`);
  process.send ({ heartRate: hr });
});

speedCadenceSensor.on('cadenceData', data => {
  debugCSC(`speed/cadence: ${data.CalculatedCadence}`);
  //process.send (Math.round (data.CalculatedCadence));

  process.send ({ crankRev: data.CumulativeCadenceRevolutionCount });
  process.send ({ crankTime: data.CadenceEventTime });
});

speedCadenceSensor.on('speedData', data => {
  debugCSC(`speed/cadence: ${data.CalculatedSpeed}`);
});

stick.on('startup', function () {
	console.log('stick ANT+ On');
  heartRateSensor.attach(2, 0);
  speedCadenceSensor.attach(1, 0);
});

stick.on('shutdown', function () {
	console.log('stick ANT+ Shutdown');
});

if (!stick.open()) {
	console.log('Stick not found!');
}

process.on('message', cmd => {
  //console.log ('cmd:', cmd);
  if (cmd.terminate != null){
    if (stick)
      stick.close ();
    process.exit();
  }
});