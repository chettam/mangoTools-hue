const log = require('./log').logger;


function displayResult(result){
    log.verbose(result)
}

function displayError(error){
    log.error('Error while sending command to Hue lights : ' +error)
}
const HueApi = require("node-hue-api").HueApi,
    utils = require("./utils");

module.exports = {
    executeCmd : function(state,value){

        api = new HueApi(state.cnx.options.host, state.cnx.options.user);
        switch(state.name) {
            case 'color':
                api.setLightState(parseInt(state.attributes.id), utils.toHSB(value)) // provide a value of false to turn off
                    .then(displayResult)
                    .fail(displayError)
                    .done();
                break;
            case 'on':
                api.setLightState(parseInt(state.attributes.id), {"on": value === 1 ? true : false}) // provide a value of false to turn off
                    .then(displayResult)
                    .fail(displayError)
                    .done();
        
                break;
            default:
                log.error('command not handled')
        
        }



    }
};