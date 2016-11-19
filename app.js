// Setup relay and indicator light furnace.
var GPIO = require('onoff').Gpio,
    led = new GPIO(20, 'out');
    relay = new GPIO(21, 'out');
    led.writeSync(0);
    relay.writeSync(1);

// Setup Util Functions
function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes*60000);
}


// Setup state objects for system
var User = { "User": "bobdole@gmail.com", "Password": "schwimme1975", "Authorized": false };
var Boiler = { "BoilerOn": false, "StatusTime": addMinutes(new Date(), -100), BoilerMode: "Debug" };
var System = { 	"AvgTemp": 68, 
		"Schedules": [{"TempLow": 67, "TempHigh": 68, "StartTimeHour": 0, "StartTimeMinute": 0}, {"TempLow": 67, "TempHigh": 68, "StartTimeHour": 1, "StartTimeMinute": 0}], 
		"Boiler": Boiler,
		"User": User,
		"DebugLevel": 0,
		"Zones": [{ "CurTemp": 68, "TempHi": 69, "TempLow": 68, "Light": 10, "Humidity": 33, "CallHeat": false, "ZoneName": "Upstairs", "ZoneNumber": 0 }, 
	     		  { "CurTemp": 68, "TempHi": 69, "TempLow": 68, "Light": 10, "Humidity": 33, "CallHeat": false, "ZoneName": "Living Room", "ZoneNumber": 1 }] };debugLog(System.Boiler.BoilerMode ,4)
// Setup expressJS
/**
 * Module dependencies.
 */

function compare(a,b) {
  var startTimeA = (a.StartTimeHour*60) + a.StartTimeMinute;
  var startTimeB = (b.StartTimeHour*60) + b.StartTimeMinute;
  return startTimeA - startTimeB;
}

var express = require('express')
  , routes = require('./routes')
  , cookieParser = require('cookie-parser')
  , http = require('http')
  , path = require('path')
  , bodyParser = require('body-parser')
  , favicon = require('serve-favicon')
  , logger = require('morgan')
  , methodOverride = require('method-override');

var app = express();

app.set('port', process.env.PORT || 80);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(favicon(__dirname + '/public/images/favicon.png'));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

if (app.get('env') == 'development') {
        app.locals.pretty = true;
}

// Setup Routes
app.get('/about', routes.about);
app.get('/', function(req, res){
  res.end();
});

/*
custom status page from other project
*/
var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://192.168.1.120')

client.on('connect', function () {
  client.subscribe('sensors')
  //client.publish('testbutton', 'hello mqtt');
})

client.on('message', function (topic, message) {
  // message is Buffer 
  console.log(message.toString())
  
  var obj = JSON.parse(message)
  var sensor = obj[0];
  console.log("zone: " + sensor.zone)
  console.log("temp: " + sensor.tempf)
  console.log("light: " + sensor.light)
  
  // Read temp data
  if(sensor.tempf < 50 || sensor.tempf > 90)
  {
      debugLog("Temp from sensor out of range: " + sensor.tempf, 2);
      return;
  }
  else
	System.Zones[sensor.zone].CurTemp = sensor.tempf;
	
  System.Zones[sensor.zone].Humidity=sensor.humidity;
  System.Zones[sensor.zone].Light=sensor.light;
  SetAverageTemp();

  
  // Get current schedule to compare against the temps read
  System.curSchedule = getCurrentSchedule(System.Schedules);
  if((System.AvgTemp < System.curSchedule.TempHigh) && !System.Boiler.BoilerOn)
  {
    debugLog("avgTmp: "  + System.AvgTemp +  " > zoneHi: " + System.curSchedule.TempHigh + " && boiler status: " + System.Boiler.BoilerOn, 6);
    UpdateBoilerStatus(true);
    debugLog("calling for heat On: " + System.Boiler.BoilerOn, 6);
  }
  else if((System.AvgTemp > System.curSchedule.TempHigh) && System.Boiler.BoilerOn)
  {
    debugLog("avgTmp: "  + System.AvgTemp +  " > zoneHi: " + System.curSchedule.TempHigh + " && boiler status: " + System.Boiler.BoilerOn, 6);
    UpdateBoilerStatus(false);
    debugLog("calling for heat Off: " + System.Boiler.BoilerOn, 6);
  }
  else
  {
    UpdateBoilerStatus(false);
    debugLog("calling for heat ELSE	: " + System.Boiler.BoilerOn, 6);
  }
  
  updateRelay(System.Boiler.BoilerOn, false);
})

app.post('/addSchedule',function(req,res){
  var newSchedule = {};
  newSchedule.TempLow = req.body.TempLow;
  newSchedule.TempHigh = req.body.TempHigh;
  newSchedule.StartTimeHour = req.body.StartTimeHour;
  newSchedule.StartTimeMinute = req.body.StartTimeMinute;
  System.Schedules.push(newSchedule);

  System.Schedules.sort(compare);
  res.redirect('/schedule');
});

app.post('/deleteSchedule',function(req,res){
  System.Schedules.splice(req.body.index, 1);
  res.redirect('/schedule');
});

app.get('/on',function(req,res){
/*
  if(!checkIsAuthorized)
  {
    res.end();
  }
*/
//  res.sendfile("indexon.html");
  System.Boiler.BoilerOn = true;
  UpdateBoilerStatus(true, true);
  updateRelay(System.Boiler.BoilerOn);
  debugLog("Turned Relay on" + System.Boiler.BoilerOn, 2);
  res.render('status', {System: System});
});


app.get('/off',function(req,res){
/*
  if(!checkIsAuthorized)
  {
    res.end();
  }
*/
//  res.sendfile("indexoff.html");
  System.Boiler.BoilerOn = false;
  UpdateBoilerStatus(false, true);
  updateRelay(System.Boiler.BoilerOn);
  debugLog("Turned Relay off" + System.Boiler.BoilerOn, 2);
  res.render('status', { System: System });
});


app.get('/BoilerModeProduction', function(req,res){
/*
  if(!checkIsAuthorized)
  {
    res.end();
  }
*/
  System.Boiler.BoilerMode = "Production";
  debugLog("Prod Mode: " + System.Boiler.BoilerMode, 2);
  res.render('status', { System: System });
});
app.get('/BoilerModeDebug', function(req,res){
  System.Boiler.BoilerMode = "Debug";
  res.render('status', { System: System });
  debugLog("Debug Mode: " + System.Boiler.BoilerMode, 2);
});

// Show status of Heating system
app.get('/status', function(req, res){
/*
  if(!checkIsAuthorized)
  {
    res.end();
  }
*/
  console.log("auth: " + req.cookies.authorized);
  res.render('status', {System: System});
});

// Show status of Heating system
app.get('/schedule', function(req, res){
  console.log("schedule: " + req.cookies.authorized);
  res.render('schedule', {System: System});
});


// Show status of Heating system
app.get('/login', function(req, res){
  res.render('login');
});

// change this to a better error handler in your code
// sending stacktrace to users in production is not good
app.use(function(err, req, res, next) {
  res.send(err.stack);
});

http.createServer(app).listen(app.get('port'), function(){
  debugLog("Express server listening on port " + app.get('port'), 2);
});


// start a timer that runs the callback
// function every second (1000 ms)
function updateRelay(state)
{
  debugLog("Updating Relay...." + state, 4);
  // get the current state of the LED
  var ledState = state;
  var relayState = !state;

  debugLog("ledState " + ledState + " | relayState: " + relayState, 4);
  debugLog("Number(ledState): " + Number(ledState), 4);
  debugLog("BoilerMode: " + System.Boiler.BoilerMode, 4);
  // write new start to relay and led
  led.writeSync(Number(ledState));
  if(System.Boiler.BoilerMode == "Production")
  {
    debugLog("updating relay state: " + Number(relayState));
    relay.writeSync(Number(relayState));
  }
  //debugLog("led state: " + ledState, 2);
  //debugLog("relay state: " + relayState, 2);
};

function SetAverageTemp()
{
  System.AvgTemp = (System.Zones[0].CurTemp + System.Zones[1].CurTemp) / 2;
  debugLog("AvgTemp = " + System.AvgTemp + " System.Zones[0].CurTemp " + System.Zones[0].CurTemp + " +  System.Zones[1].CurTemp / 2", 2);
  debugLog("result: " + (System.Zones[0].CurTemp + System.Zones[1].CurTemp) / 2, 2);
}

function UpdateBoilerStatus(status, force)
{
  if((status && !System.Boiler.BoilerOn && System.Boiler.StatusTime < addMinutes(new Date(), -5)) || (status && force))
  {
    System.Boiler.BoilerOn = true;
    debugLog("turning boiler on: " + System.Boiler.BoilerOn, 3);
    System.Boiler.StatusTime = new Date();
  }
  else if(!status && System.Boiler.BoilerOn && System.Boiler.StatusTime < addMinutes(new Date(), -5) || (!status && force))
  {
    System.Boiler.BoilerOn = false;
    debugLog("turning boiler off: " + System.Boiler.BoilerOn, 3);
    System.Boiler.StatusTime = new Date();
  }
  else
  {
    debugLog("Update Boiler Else Case.", 3);
  }
}

function debugLog(message, debugLevel)
{
  if(debugLevel > System.DebugLevel)
  {
    console.log(message);
  }
}

app.post('/authorize',function(req,res){
  console.log("user name: " + req.body.user + " | System.User.User: " + System.User.User);
  console.log("pass: " + req.body.password + " | System.User.Password: " + System.User.Password);

  if(req.body.user === System.User.User && req.body.password === System.User.Password)
  {
      console.log("Auth Success setting cookie");
/*
      // To Write a Cookie
      res.writeHead(200, {
        'Set-Cookie': 'authorizedCookie=true',
        'Content-Type': 'text/plain'
      });
*/

        res.cookie('authorized' , true, {expire : new Date() + 9999});
        res.redirect('/about');
  }
  else
  {
      console.log("Auth Fail");
      res.redirect('http://www.cnn.com');
  }
});

function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

function checkIsAuthorized(req)
{
  return (typeof req.cookies.authorized != 'undefined' && req.cookies.authorized === true);
}

function getCurrentSchedule(schedules){
  
  var timeOffset = 4;
  var currentSchedule = schedules[0];
  var arrayLength = schedules.length;
  var d = new Date();
  var hour = d.getHours() - timeOffset;
  var minute = d.getMinutes();

  if(hour < 0)
  {
    hour = 24 - hour;
  }

  var curTime = ConvertToMinutes(hour, minute);
  

  currentSchedule = schedules[0];
  console.log("date hour: " + hour);
  for(i=0;i<arrayLength;i++)
  {
    var scheduleTime = ConvertToMinutes(schedules[i].StartTimeHour, schedules[i].StartTimeMinute);

    if(scheduleTime >= curTime){
      break;
    }
    else
      currentSchedule = schedules[i];
    }

/*
    if(schedules[i].StartTimeHour >= hour){
      break;
    }
    if(schedules[i].StartTimeHour == hour && schedules[i].StartTimeMinute >= minute)
    {
      break;
    }
    else
      currentSchedule = schedules[i];
  }
*/

  return currentSchedule;
}

function ConvertToMinutes(hours, minutes)
{
  var timeMinutes = minutes;
  timeMinutes += hours * 60;
  return timeMinutes;
}