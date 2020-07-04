'use strict'

const debugCSP = require('debug')('csp');

const seriportpath = '/home/pi/node-serialport/node_modules/serialport';
const fs = require("fs")
const path = "/dev/ttyUSB_FTDI"
//https://www.freva.com/2019/06/20/assign-fixed-usb-port-names-to-your-raspberry-pi/

var SerialPort = require(seriportpath);
var port = null;
var ctInPro = false;
var gradeReality = 1;

var openCT = function() {
  fs.access(path, fs.F_OK, (err) => {
    if (!err) {
      port = new SerialPort('/dev/ttyUSB_FTDI', {
        baudRate: 2400,
      });
      if (port){
        port.on("open", function () {
          console.log('CT Open');
          port.on('data', rcvFromCT);
        });
      }
    }
  });
}

var posBufferInCT = 0;
var buffCT = new Uint8Array(7) ;
var SyncCT = false;
var powerCT = 0;

var procFromCT = function() {
  //console.log ('cmd:', buffCT[4] & 0x78);
  if ((buffCT[4] & 0x78) == 0x10)
  {
    // power frame
    powerCT = buffCT[4] & 0x0f;
    powerCT = powerCT << 1;
    if (buffCT[6] & 0x2)
      powerCT = powerCT + 1;
    powerCT = powerCT << 7;
    powerCT = powerCT + (buffCT[5] & 0x7f);
    powerCT = powerCT << 1;
    powerCT = powerCT + (buffCT[6] & 0x1);

    powerCT = 200 + 50 * Math.random() - 50 * Math.random();

    debugCSP('power:', powerCT);
    process.send ({ power: powerCT });
  }
}

var rcvFromCT = function(data) {
  var i = 0;
  for (i = 0; i < data.byteLength; i++)
  {
    if (SyncCT)
    {
      buffCT[posBufferInCT++] = data[i];
    }
    if (data[i] & 0x80)
    {
      posBufferInCT = 0;
      SyncCT = true;
      //console.log (buffCT);
      procFromCT (buffCT);
    }
    if (posBufferInCT >= 8)
    {
      SyncCT = false;
      posBufferInCT = 0;
    }
  }
  //console.log(data.byteLength);
  //console.log(data);
}

var sout = [0x35, 0x00, 0x00, 0x16, 0x08, 0x00, 0xE0, 
            0x59, 0x00, 0x00, 0x16, 0x10, 0x00, 0xE0, 
            0x74, 0x00, 0x00, 0x16, 0x18, 0x5D, 0xC1, 
            0x27, 0x00, 0x00, 0x16, 0x24, 0x1E, 0xE0, 
            0x5E, 0x00, 0x00, 0x16, 0x2C, 0x5F, 0xE0, 
            0x35, 0x00, 0x00, 0x16, 0x34, 0x00, 0xE0, 
            0x21, 0x00, 0x00, 0x16, 0x38, 0x10, 0xC2, 
            0x29, 0x00, 0x00, 0x16, 0x40, 0x00, 0xE0];

//sout = [0x35, 0x00, 0x00, 0x16, 0x08, 0x00, 0xE0];
  
var sendToCT = function() {
  if (!port)
    openCT();
  else if (ctInPro){
    port.write (sout);
  }
  setTimeout(sendToCT, 500);
}

var adjustBufferCT = function (grade){
  var g = 0;
  
  if (grade < 0)
    grade = 0;
  if (grade >= 0){
    g = grade;
    sout[5] = 0x35 * g * gradeReality / 75
    sout[0] = 0x35 - sout[5];
  } 
  console.log ('grade no CT:', g);
}

process.on('message', (cmd) => {
  if (cmd.terminate != null){
    port.close(function (err) {
      console.log('port closed', err);
    });
    process.exit();
  }
  if (cmd.gradeReality != null){
    gradeReality = cmd.gradeReality;
    console.log ('grade reality:', gradeReality)
  }

  if (cmd.CTInPro != null){
    ctInPro = cmd.CTInPro;
    console.log ('Computrainner in Pro Mode:', ctInPro);
  }

  if (cmd.grade != null)
    adjustBufferCT (cmd.grade);
});

//let buf = Buffer (sout);
//console.log (buf);
//sout = "RacerMate";
sendToCT ();
