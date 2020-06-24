const seriportpath = '/home/pi/node-serialport/node_modules/serialport';
const fs = require("fs")
const path = "/dev/ttyUSB_FTDI"
//https://www.freva.com/2019/06/20/assign-fixed-usb-port-names-to-your-raspberry-pi/

var SerialPort = require(seriportpath);
var port = null;

var openCT = function() {
  fs.access(path, fs.F_OK, (err) => {
    if (!err) {
      port = new SerialPort('/dev/ttyUSB_FTDI', {
        baudRate: 2400,
      });
      if (port){
        port.on("open", function () {
          console.log('open');
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
  if ((buffCT[4] == 8) || (buffCT[4] == 15))
    console.log (buffCT);
}

var rcvFromCT = function(data) {
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

//var sout = "350000160800E0590000161000E074000016185DC127000016241EE05E0000162C5FE0350000163400E0210000163810C2290000164000E0"
var sout = [0x35, 0x00, 0x00, 0x16, 0x08, 0x00, 0xE0, 
            0x59, 0x00, 0x00, 0x16, 0x10, 0x00, 0xE0, 
            0x74, 0x00, 0x00, 0x16, 0x18, 0x5D, 0xC1, 
            0x27, 0x00, 0x00, 0x16, 0x24, 0x1E, 0xE0, 
            0x5E, 0x00, 0x00, 0x16, 0x2C, 0x5F, 0xE0, 
            0x35, 0x00, 0x00, 0x16, 0x34, 0x00, 0xE0, 
            0x21, 0x00, 0x00, 0x16, 0x38, 0x10, 0xC2, 
            0x29, 0x00, 0x00, 0x16, 0x40, 0x00, 0xE0];

//sout = [0x35, 0x00, 0x00, 0x16, 0x08, 0x00, 0xE0];
  
openCT ();
