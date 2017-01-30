const utils = require('./utils');
const request = require('request');
const CryptoJs = require('crypto-js');
const log = require('./log').logger;
const async = require('async');

let states = [];
let apiKeyEnc;


/**
 *  parse a hue light
 * @param id
 * @param light
 * @param connection
 */
function parseLight(id,light,connection){
    var kind;
    if(light.modelid.indexOf('C') !== -1) kind = 'colorPicker';
    if(light.modelid.indexOf('W') !== -1) kind = 'dimmer';
    var device = {
        active : light['state'].reachable === true ? 1:0,
        uid : light.uniqueid,
        kind : kind,
        name : light.name,
        infoOnly : false
    };

    states.push({ name : 'on'    , execute : true , uid : light.uniqueid + ':on'  , value : light['state'].on === true ? 1 :0 , actuator : light.uniqueid , attributes : {id: id} , cnx : connection  });
    states.push({ name : 'color' , uid : light.uniqueid + ':color' , execute :true, text :  JSON.stringify(utils.toHSV(light['state'].hue,light['state'].sat,light['state'].bri)), actuator : light.uniqueid, attributes : {id: id} , cnx : connection});
    
    ipc.send('device:set',device);
}






module.exports = {


    /**
     *  parse Hue config file into standard format
     * @param config
     * @param connection
     */
    config : function(config,connection){
        if(config.hasOwnProperty('lights')) {
            async.series([
                function (callback) {
                    request({url: 'http://localhost:' + process.env.port + '/api/apikey'}, function (error, response, body) {
                        apiKeyEnc = CryptoJs.SHA256(CryptoJs.SHA256(CryptoJs.SHA256(body).toString()).toString()).toString();
                        callback(null, apiKeyEnc)
                    });
                },
                function (callback) {
                    if (config.lights) {
                        async.forEachOf(config.lights, function (actuator,id, cb) {
                            parseLight(id,actuator,connection);
                            cb();
                        }, function (err) {
                            if (err) {
                                console.log('A file failed to process');
                            } else {
                                request({
                                    url: 'http://localhost:' + process.env.port + '/api/anon/device',
                                    headers: {'apiKey': apiKeyEnc}
                                }, function (error, response, body) {
                                    async.each(states, function (state, cb) {
                                        log.silly(state)
                                        log.silly(JSON.parse(body))
                                        state.device = _.find(JSON.parse(body), function (d) {
                                            return d.uid === state.actuator;
                                        });
                                        cb()
                                    }, function (err) {
                                        callback()
                                    });
                                });
                            }
                        });
                    } else {
                        callback('no Function')
                    }
                }
            ], function (err, result) {
                //console.log(JSON.stringify(states))
                ipc.send('state:set', states);
                log.debug("Configuration parsing complete");
            });
        }
    }
};