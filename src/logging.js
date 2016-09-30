var winston = require('winston');
var dailyLogRotation = require('winston-daily-rotate-file');

var props = require('./properties.js');

var logger = null;
var application = props.get('LOG_APPLICATION');
var category = props.get('LOG_CATEGORY');

// Creates a JSON blob to log based on the incoming parameters
function logSerializer(req, res, options) {
  // If no options are provided - initialize them
  if (!options) {
    options = {};
  }
  
  options.data_version = 1;
  options.type = 'log';
  options['@timestamp'] = new Date().toISOString();
  
  if (!options.callouts_data) {
    options.callouts_data = {};
  }
  options.callouts_data.family = category;
  
  // These should always be the same for the app
  options.application = application;
  
  // If the request is provided grab a few fields off it and log them
  if (req) {
    options.request_method = req.method;
    options.url = req.url;
    options.headers_obj = req.headers;
    options.request_payload = JSON.stringify(req.body);
  }
  
  // If the response is provided grab the correlation id and log it
  if (res) {
    options.correlation_id = res.get(props.get('CORRELATION_ID_KEY'));
  }
  
  return options;
}

// Called on every logging request but only initializes a logger the first time through.  Specifies a daily, rotating
// log file at a position defined in the properties file.  Log to console so init steps can be seen in the console.
function initializeLogger() {
  if (!logger) {
    fileName = props.get('LOG_FILE_LOCATION');
    logger = new (winston.Logger)({
      transports: [
        new (dailyLogRotation)({
          filename: fileName
        })
      ]
    })
  }
}
    
// ***************** The following functions are the only ones exposed to external classes *****************
// Log in DEBUG mode - this should be turned off in production by default
function debug(req, res, options) {
  initializeLogger();
  logger.debug(logSerializer(req, res, options));
}

// Error always logs no matter the logging setting
function error(req, res, options, msg) {
  initializeLogger();
  logger.error(logSerializer(req, res, options));
}

// Standard method for outputting information worth tracking from the service
function info(req, res, options) {
  initializeLogger();
  if (!options) {
    options = {};
  }
  options.level = 'DEBUG';
  //logger.info(logSerializer(req, res, options));
  console.log(JSON.stringify(logSerializer(req, res, options)));
}

// Expose debug, info and error for developers to use
module.exports = {
  debug: debug,
  error: error,
  info: info
};