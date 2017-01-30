const log = require('./helpers/log').logger;
const ipc = require('./helpers/ipc');



log.info('Hue Module has started');
ipc.start(process.env);


