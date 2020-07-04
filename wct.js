
'use strict'

const debugBLE = require('debug')('ble');
const debugCSP = require('debug')('csp');
const debugFEC = require('debug')('fec');
const debugHRM = require('debug')('hrm');
const debugCSC = require('debug')('csc');
const debugMQTT = require('debug')('mqtt');

var wahooCTBLE = require('./lib/wahooCT-ble-sensor');
const readline = require('readline');
const { fork } = require('child_process');

const topicCmd = 'wahooCT/cmd';
const topicVal = 'wahooCT/val';

// default parameters
var simulPower = false;
var simulHR = false;
var simulCadence = false;
var powerCorrection = 1;
var gradeReality = 1;
var cadence = 0;
var power = 0;
var crankRev = 0;
var crankTime = 0;
var sensorName = 'Wahoo KICKR';
var hr = -1;
var stroke_count = 0;
var notificationInterval = 1000;
var prcCT = null;
var prcAnt = null;
var ctInPro = false;

function calibrate (valor){
  if (!prcCT){
    console.log ("Computrainner not connected");
  }
  else{
    console.log('calibrate:', valor);
    prcCT.send({CTInPro: valor});
  }
}

/* MQTT */
var mqtt    = require('/usr/local/lib/node_modules/mqtt');
var count =0;
var client  = mqtt.connect("mqtt://127.0.0.1",{clientId:"wahooCT"});
debugMQTT("connected flag  " + client.connected);

//handle incoming messages
client.on('message',function(topic, message, packet){
	debugMQTT("message is "+ message);
  debugMQTT("topic is "+ topic);
  if (topic == topicCmd){
    const obj = JSON.parse (message);
    if (obj.calibrate == true)
      calibrate (true);
    if (obj.calibrate == false)
      calibrate (false);
  }
});

client.on("connect",function(){	
  debugMQTT("connected  "+ client.connected);
})

//handle errors
client.on("error",function(error){
  debugMQTT("Can't connect" + error);
});

  //publish
function publish(topic,msg,options){
  debugMQTT("publishing",msg);
  if (client.connected == true){
	  client.publish(topic,msg,options);
  }
}
//////////////

var options={
  retain:false,
  qos:1
};

debugMQTT('subscribing to:' + topicCmd);
client.subscribe(topicCmd);

/*
var topic="testtopic";
var message="test message";
var topic_list=["topic2","topic3","topic4"];
var topic_o={"topic22":0,"topic33":1,"topic44":1};

console.log("subscribing to topics");
client.subscribe(topic,{qos:1}); //single topic
client.subscribe(topic_list,{qos:1}); //topic list
client.subscribe(topic_o); //object
var timer_id=setInterval(function(){publish(topic,message,options);},5000);
//notice this is printed even before we connect
console.log("end of script");

/* /MQTT */

readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

var wahooCTBLE = new wahooCTBLE({ 
  name: sensorName,
  modelNumber: '2',
  serialNumber: '5E09'
});

process.stdin.on('keypress', (str, key) => {
  if (key.name === 'x' || key.name == 'q' || ( key.ctrl && key.name == 'c' ) ) {
    if (prcCT != null)
      prcCT.send ({ terminate: true });
    if (prcAnt != null)
      prcAnt.send ({ terminate: true });
    process.exit(); // eslint-disable-line no-process-exit
  } else if (key.name === 'l') {
    listKeys();
  } 
  switch(key.name) {
    case 'c':
      if (ctInPro)
        ctInPro = false;
      else
        ctInPro = true;
      calibrate (ctInPro);
      listKeys();
      break;

    defaut:
      listKeys();
      break;
  }
  listParams();
});


var notifyPowerCSP = function() {
  //watts = Math.floor(Math.random() * randomness + power);
  try {
    var p = power * powerCorrection;
    if (simulPower){
      p += Math.random() * 20;
      p -= Math.random() * 20; 
    }
    debugCSP ("notifyPowerCSP - power:", p);
    wahooCTBLE.notifyCSP({'power': p});
    var pstr = '{"power" :' + p + '}';
    publish(topicVal,pstr);
  }
  catch( e ) {
    console.error(e);
  }
  
  setTimeout(notifyPowerCSP, notificationInterval);
};

var notifyHeartRateHRM = function() {
  //watts = Math.floor(Math.random() * randomness + power);
  try {
    debugHRM("notifyHeartRateHRM - hr:", hr);
    wahooCTBLE.notifyHRM({'heartrate': hr});
  }
  catch( e ) {
    console.error(e);
  }
  
  setTimeout(notifyHeartRateHRM, notificationInterval);
};

/*
var notifyCadenceCSPOld = function() {
  stroke_count += 1;
  if( cadence <= 0) {
    cadence = 0;
    setTimeout(notifyCadenceCSP, notificationInterval);
    return;
  }
  try {
    wahooCTBLE.notifyCSP({'watts': watts, 'rev_count': stroke_count });
  }
  catch( e ) {
    console.error(e);
  }
  
  setTimeout(notifyCadenceCSP, 60 * 1000/(Math.random() * randomness + cadence));
};
*/

var notifyCadenceCSC = function() {
  try {
    if (simulCadence) {
      if (crankRev >= 0x7fff)
        crankRev = 0;
      crankRev++;
      if (crankTime + 900 >= 0x7fff)
        crankTime = 0;
      crankTime+=900;
    }
    wahooCTBLE.notifyCSC({'crankRev': crankRev, 'crankTime': crankTime});
  }
  catch( e ) {
    console.error(e);
  }
  
  setTimeout(notifyCadenceCSC, notificationInterval);
};

function listParams() {
}

function listKeys() {
  console.log(`\nList of Available Keys`);
  console.log('c/C - Calibrate Computrainner');
  console.log('x/q - Exit');
  console.log();
}

// Main

console.log(`[WahooCT] Computarinner simulating a Wahoo Kickr: ${sensorName}`);

listKeys();
listParams();

const yargs = require ('yargs');
const { strict } = require('assert');
const argv = yargs
  /*.command('lyr', 'Tells whether an year is leap year or not', {
      year: {
          description: 'the year to check for',
          alias: 'y',
          type: 'number',
      }
  })*/
  .option('simu_power', {
      alias: 'sp',
      description: 'Simulate power',
      type: 'int',
  })
  .option('simu_cadence', {
    alias: 'sc',
    description: 'Simulate cadence',
    type: 'int',
  })
  .option('simu_heartrate', {
    alias: 'shr',
    description: 'Simulate heartrate',
    type: 'int',
  })
  .option('power_correction', {
    alias: 'pc',
    description: 'Power Correction factor',
    type: 'int',
  })
  .option('grade_reality', {
    alias: 'gr',
    description: 'Grade reality factor',
    type: 'int',
  })
  .help()
    .alias('help', 'h')
  
  .argv
    
if (argv.simu_power){
    //console.log('The current time is: ', new Date().toLocaleTimeString());
    power = argv.simu_power;
    console.log('simulated power:', power);
    simulPower = true;
}

if (argv.simu_cadence){
  cadence = argv.simu_cadence;
  console.log('simulated cadence:', cadence);
  simulCadence = true;
}

if (argv.simu_heartrate){
  hr = 100;
  console.log('simulated heartrate:', hr);
  simulHR = true;
}

if (argv.power_correction){
  powerCorrection = argv.power_correction;
  console.log('power correction:', powerCorrection);
}

if (argv.grade_reality){
  gradeReality = argv.grade_reality;
  console.log('grade Reality:', gradeReality);
}

if (!simulHR || !simulCadence){
  prcAnt = fork('antplus.js');
  
  prcAnt.send({start: true});
  
  prcAnt.on('message', (m) => {
    if (m.crankRev != null){
      crankRev = m.crankRev;
      debugCSC(`[WahooCT] CrankRev: ${crankRev}`)
    }
    if (m.crankTime != null){
      crankTime = m.crankTime;
      debugCSC(`[WahooCT] CrankTime: ${crankTime}`)
    }
    if (m.heartRate != null){
      hr = m.heartRate;
      debugHRM(`[WahooCT] HeartRate: ${hr}`)
    }
  });
}

if (!simulPower){
  prcCT = fork('computrainner.js');
  
  prcCT.send({gradeReality: gradeReality});
  wahooCTBLE.setCT (prcCT);
  if (prcCT){
    ctInPro = true;
    prcCT.send ({ CTInPro: ctInPro});
  }

  prcCT.on('message', (m) => {
    if (m.power != null){
      power = m.power;
      debugCSP(`[WahooCT] Power: ${power}`)
    }
  });
}

notifyPowerCSP();
notifyCadenceCSC();
notifyHeartRateHRM();
