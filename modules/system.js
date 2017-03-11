var User = require('./user');
var Boiler = require('./boiler');

var System = {
    "AvgTemp": 68,
    "Schedules": [{ "TempLow": 67, "TempHigh": 68, "StartTimeHour": 0, "StartTimeMinute": 0 }, { "TempLow": 67, "TempHigh": 68, "StartTimeHour": 1, "StartTimeMinute": 0 }],
    "Boiler": Boiler,
    "User": User,
    "DebugLevel": 0,
    "Zones": [{ "CurTemp": 68, "TempHi": 69, "TempLow": 68, "Light": 10, "Humidity": 33, "CallHeat": false, "ZoneName": "Upstairs", "ZoneNumber": 0 },
              { "CurTemp": 68, "TempHi": 69, "TempLow": 68, "Light": 10, "Humidity": 33, "CallHeat": false, "ZoneName": "Living Room", "ZoneNumber": 1 }]
};


module.exports.System = System;