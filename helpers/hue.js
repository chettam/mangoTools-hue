const hue = require("node-hue-api");
const log = require('./log').logger;
const HueApi = require("node-hue-api").HueApi;
const _ = require('lodash');
const hueApi = new HueApi();
const parser = require('./parser');
const execute = require('./execute');
const utils = require('./utils');
let lights = {};





function  updateColor(connection){
    let api = new HueApi(connection.options.host,connection.options.user);
    return setInterval(function () {
        api.getFullState(function(err, config) {
            if (err) return log.error('Hue Config error : ' + err);
            if(config.hasOwnProperty('lights')){
                _.forEach(config.lights,function(light,id){
                    updateLight(light);
                })
            }
        });
    }, 250);
}



/**
 *  parse the results of updateColor
 */
function updateLight(light){
    if(lights[light.uniqueid]){
        if(light['state'].on !== lights[light.uniqueid]['state'].on) {
            log.verbose('sending update on / off');
            lights[light.uniqueid]['state'].on = light['state'].on;
            ipc.send('state:update',{uuid : light.uniqueid + ':on', value   : light['state'].on});
        }



        if(light['state'].hue !== lights[light.uniqueid]['state'].hue || light['state'].sat !== lights[light.uniqueid]['state'].sat  || light['state'].bri !== lights[light.uniqueid]['state'].bri ) {
            lights[light.uniqueid]['state'].hue = light['state'].hue;
            lights[light.uniqueid]['state'].sat = light['state'].sat;
            lights[light.uniqueid]['state'].bri = light['state'].bri;

            ipc.send('state:update',{uuid : light.uniqueid + ':color', text : utils.toHSV(light['state'].hue,light['state'].sat,light['state'].bri)});
        }


    } else {
        lights[light.uniqueid] = light;
        ipc.send('state:update',{uuid : light.uniqueid + ':on', text : utils.toHSV(light['state'].hue,light['state'].sat,light['state'].bri)});
        ipc.send('state:update',{uuid : light.uniqueid + ':color', value   : light['state'].on });
    }
}


/**
 * Get bridge configuration
 * @param cnx
 */
function getBridge(cnx){
    let api = new HueApi(cnx.options.host,cnx.options.user);
    api.getFullState(function(err, config) {
        if (err) return log.error('Hue Config error : ' + err);
        parser.config(config, cnx);
        updateColor(cnx);
    });
};


/**
 * discover a Hue bridge and  connect to it
 */
function start(cnx){
    hue.nupnpSearch(function (err, results) {
        if (err) return log.error('Hue Discovery problem : ' + err);
        log.silly('hue discovered :  ' + JSON.stringify(results));
        log.silly(cnx);
        _.forEach(results, function (hueBridge) {
            if(cnx.hasOwnProperty('options') &&cnx.options.hasOwnProperty('host') && cnx.options.hasOwnProperty('user') && cnx.options.hasOwnProperty('serialNumber')){
                if(hueBridge.ipaddress !== cnx.options.host){
                    cnx.options.host = hueBridge.ipaddress;
                    ipc.send('cnx:update',cnx)
                }
                getBridge(cnx);
            }else if(cnx.hasOwnProperty('options') && cnx.options.hasOwnProperty('host') && cnx.options.hasOwnProperty('serialNumber')) {
                cnx.options.authRequired = true;
                ipc.send('cnx:update',cnx)
                log.error('Bridge needs to be registered : ' + JSON.stringify(cnx) )
            } else {
                cnx.options = {};
                cnx.options.host = hueBridge.ipaddress;
                cnx.options.serialNumber = hueBridge.id;
                cnx.options.authRequired = true;
                log.error(' New Bridge Updating DB : ' + JSON.stringify(cnx));
                ipc.send('cnx:update',cnx)
            }
        });
    });
}


/**
 * register the hue bridge with the core.
 * @param cnx
 */
function register(cnx){
    var userDescription = "mango Tools User";
    log.silly('cnx:auth');
    hueApi.registerUser(cnx.options.host, userDescription)
        .then(function(user){
            cnx.options.user = user;
            delete cnx.options.authRequired;
            ipc.send('cnx:update',cnx);
        })
        .fail(function(err){
            ipc.send('cnx:update',cnx);
            log.error("Hue registration failed: " + err )
        })
        .done();
}




module.exports = {
    start : start,
    register : register
}