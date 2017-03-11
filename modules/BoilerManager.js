// start a timer that runs the callback
// function every second (1000 ms)
function updateRelay(state, relay) {
    debugLog("Updating Relay...." + state, 4);
    // get the current state of the LED
    var ledState = state;
    var relayState = !state;

    debugLog("ledState " + ledState + " | relayState: " + relayState, 4);
    debugLog("Number(ledState): " + Number(ledState), 4);
    debugLog("BoilerMode: " + System.Boiler.BoilerMode, 4);
    // write new start to relay and led
    led.writeSync(Number(ledState));
    if (System.Boiler.BoilerMode == "Production") {
        debugLog("updating relay state: " + Number(relayState));
        relay.writeSync(Number(relayState));
    }
    //debugLog("led state: " + ledState, 2);
    //debugLog("relay state: " + relayState, 2);
};

module.exports.updateRelay = updateRelay;