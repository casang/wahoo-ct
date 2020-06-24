'use strict';

const Ant = require('/home/pi/ant-plus');
const stick = new Ant.GarminStick2();
const heartRateSensor = new Ant.HeartRateSensor(stick);
const speedCadenceSensor = new Ant.SpeedCadenceSensor(stick);
speedCadenceSensor.setWheelCircumference(2.120); //Wheel circumference in meters

heartRateSensor.on('hbData', data => {
  var hr = data.ComputedHeartRate;
  console.log(`heart rate: ${hr}`);
  process.send ({ heartRate: hr });
});

//seedCadenceSensor.on('hbData', data => {
speedCadenceSensor.on('cadenceData', data => {
    console.log(`speed/cadence: ${data.CalculatedCadence}`);
    //process.send (Math.round (data.CalculatedCadence));

    process.send ({ crankRev: data.CumulativeCadenceRevolutionCount });
    process.send ({ crankTime: data.CadenceEventTime });
});

speedCadenceSensor.on('speedData', data => {
    console.log(`speed/cadence: ${data.CalculatedSpeed}`);
});

stick.on('startup', function () {
	console.log('Sticker ANT+ On');
    heartRateSensor.attach(2, 0);
    speedCadenceSensor.attach(1, 0);
});

if (!stick.open()) {
	console.log('Stick not found!');
}

process.on('message', cmd => {
    //console.log(`Message Chield: ${cmd}`)
    if (cmd == 'terminate'){
      stick.close ();
      process.exit();
    }
  });