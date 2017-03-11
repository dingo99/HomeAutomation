var time = require('time');

var getTimeZone = function () {
    var now = new time.Date();
    now.setTimezone("America/New_York");

    console.log("time: " + now.getTime().toString());

    return now;
}

var addMinutes = function (date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}

var ConvertToMinutes = function (hours, minutes) {
    var timeMinutes = minutes;
    timeMinutes += hours * 60;
    return timeMinutes;
}

var getFormattedTime = function (fourDigitTime) {
    var hours24 = parseInt(fourDigitTime.substring(0, 2), 10);
    var hours = ((hours24 + 11) % 12) + 1;
    var amPm = hours24 > 11 ? 'pm' : 'am';
    var minutes = fourDigitTime.substring(2);

    return hours + ':' + minutes + amPm;
};

module.exports.addMinutes = addMinutes;
module.exports.ConvertToMinutes = ConvertToMinutes;
module.exports.getFormattedTime = getFormattedTime;
module.exports.getTimeZone = getTimeZone;