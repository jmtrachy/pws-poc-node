// properties.js
// Eventually this file should almost entirely be moved to external properties files and injected via docker startup scripts
// ==========
var fs = require('fs');

var environment = process.env.PWS_ENVIRONMENT;
if (!environment) {
  environment = 'local';
}

var envFile = 'envs/' + environment + '/pws_config.json';

var properties = properties = JSON.parse(fs.readFileSync(envFile, 'utf8'));

/*
var properties = {
  CORRELATION_ID_KEY: 'concur-correlationid',
  LOG_FILE_LOCATION: '/var/log/pws/callouts.log',
  LOG_APPLICATION: 'PWS',
  LOG_CATEGORY: 'Callouts',
  
  SERVER_PORT: 5000
};
*/

function getProperty(key) {
  return properties[key];
}

module.exports = {
  get: getProperty
};