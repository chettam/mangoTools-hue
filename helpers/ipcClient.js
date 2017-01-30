const ipc = require('node-ipc');
const hue = require('./hue');
const execute = require('./execute');
const log = require('./log').logger;


exports.start = function (cnx) {
    ipc.config.id = cnx.uid;
    ipc.config.retry = 1500;
    ipc.config.silent = true;

    ipc.connectTo('homfi', function () {
        ipc['of']['homfi'].on('connect', function () {
            ipc['of']['homfi'].emit('register',cnx)
            ipc['of']['homfi'].emit('cnx:get', cnx)
        });
        ipc['of']['homfi'].on('disconnect', function () {
            //ipc.log('disconnected from world'.notice);
        });

        ipc['of']['homfi'].on('cnx:get', function (data) {
            log.silly('cnx:get');
            hue.start(data)
        });

        ipc['of']['homfi'].on('cnx:auth', function (data) {
            hue.register(data)
        });
        
        ipc['of']['homfi'].on('state:update', function (data) {
            execute.executeCmd(data.state,data.value);
        });
    });
};

exports.send = function(endpoint,message){
    ipc['of']['homfi'].emit(endpoint,message)
};
