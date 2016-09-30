// proxy-handler.js
// ===========
// Standard modules
var o2x = require('object-to-xml');

// Custom (internal) modules
var client = require('./client.js');
var logging = require('./logging.js');
var props = require('./properties.js');
var validate = require('./validation.js');

// Specify the response Content-Type header based on the requests Accept header.  This will respond in either
// JSON or XML - with preferences of XML and defaulting to XML.
function getResponseContentType(acceptHeader) {
  contentType = null;
  
  if (acceptHeader != null && acceptHeader.indexOf('application/json') != -1) {
    contentType = 'application/json; charset=utf-8';
  } else {
    contentType = 'application/xml; charset=utf-8';
  }
  
  return contentType;
}

// The least fun part of this little app - string parsing for specific values
// Parse out the URL of the request - the node client library requires protocol, host and path to all be separate parameters
function parseUrl(url) {
  result = {};
  protocolEndIndex = -1;

  if (url.substring(0, 5) == 'https') {
    result['isSecure'] = true;
    protocolEndIndex = 8;
  } else {
    result['isSecure'] = false;
    protocolEndIndex = 7;
  }

  hostTempSubString = url.substring(protocolEndIndex);
  hostIndex = hostTempSubString.indexOf('/');
  hostSubString = hostTempSubString.substring(0, hostIndex);

  if (hostSubString.indexOf(':') >= 0) {
    tokens = hostSubString.split(':');
    result['host'] = tokens[0];
    result['port'] = tokens[1];
    //console.log('host and port = ' + result['host'] + ':' + result['port']);
  } else {
    result['host'] = hostSubString;
    //console.log('host = ' + result['host']);
  }

  result['path'] = hostTempSubString.substring(hostIndex);
  //console.log('path = ' + result['path']);

  return result;
}

// Prepare the options to pass into the request
function prepareRequestOptions(req, loggingOptions) {
  connectorProxy = req.body['connector-proxy-request'];
  
  username = connectorProxy['user-name'];
  password = connectorProxy['password'];
  url = connectorProxy['url'];
  method = connectorProxy['method'];
  
  loggingOptions.callouts_data.request_body = JSON.stringify(req.body);
  loggingOptions.callouts_data.url = url;
  loggingOptions.callouts_data.method = method;
  
  if (method == null || method == '') {
    method = 'GET';
  }
  method = method.toUpperCase();

  // parse the URL for the actual parameters
  urlParams = parseUrl(url);

  validate.validateSendRequestInput(username, password, url, method);
  
  var requestOptions = {
    host: urlParams['host'],
    path: urlParams['path'],
    method: method,
    headers: {
      'Authorization': 'Basic ' + new Buffer(username + ':' + password).toString('base64')
    }
  };
  
  if (urlParams['port'] != null) {
    requestOptions['port'] = urlParams['port'];
  }

  return requestOptions;
}

// Create the actual response to send to the calling service.  This function is passed into the proxy-handler
// but is defined here.
function createResponse(res, statusCode, body, loggingOptions) {
  var responseBody = null;
  
  // Set the response based on whether the caller is expecting XML or JSON
  if (res.getHeader('Content-Type').indexOf('xml') > -1) {
    if (statusCode > 199 && statusCode < 300) {
      responseBody = body;
    } else {
      xmlError = {
        "Error": body
      }
      responseBody = o2x(xmlError);
    }
  } else {
    responseBody = JSON.stringify(body);
  }
  
  if (!loggingOptions) {
    loggingOptions = {};
  }
  
  if (!loggingOptions.callouts_data) {
    loggingOptions.callouts_data = {};
  }

  // Log all response bodies...for now
  loggingOptions.callouts_data.response_body = responseBody;
  
  logging.info(null, res, loggingOptions);
  res.status(statusCode).send(responseBody);
}

// Grabs the body of the request if it is expecting to post
function generatePost(requestOptions, req) {
  body = o2x(req.body['connector-proxy-request']['content-body']);
  requestOptions.headers['Content-Length'] = Buffer.byteLength(body)
  
  return body;
}

// Handles all requests into the PWS service
function handleSendRequest(req, res) {
  // Create a logging options object and fill it out as the process proceeds
  loggingOptions = {
    callouts_data: {
    }
  };
  
  // The response content type should be set based on the senders preference
  contentType = getResponseContentType(req.headers['accept']);
  res.setHeader('Content-Type', contentType);
  loggingOptions.callouts_data.content_type = contentType;
    
  // Try parsing the request and proxying on to the client.  Catch EINVAL as 400's meaning the request is bad
  try {
    // Parse the incoming request for data to perform the outgoing request.  Input validation is performed within this method.
    requestOptions = prepareRequestOptions(req, loggingOptions);
    body = null;
    
    if (requestOptions.method == 'POST') {
      body = generatePost(requestOptions, req);
      loggingOptions.callouts_data.post_body = body;
    }
    
    client.sendRequest(false, createResponse, res, requestOptions, body, loggingOptions);
  } catch (err) {
    response_code = null;
    if (err.code == 'EINVAL') {
      response_code = 400;
    } else {
      response_code = 500;
    }
    
    // Create a response to the caller with important information
    responseBody = {
      error_code: err.code,
      description: err.message,
      correlation_id: res.get(props.get('CORRELATION_ID_KEY'))
    };
    
    loggingOptions.callouts_data.response_exception_code = err.code;
    loggingOptions.callouts_data.response_error_code = response_code;
    loggingOptions.callouts_data.response_error_message = err.message;
    loggingOptions.callouts_data.response_error_stack = err.stack;
    loggingOptions.callouts_data.response_body = JSON.stringify(responseBody);
    
    // Create a response for this error
    createResponse(res, response_code, responseBody, loggingOptions);
  }
}

module.exports = {
  handleSendRequest: handleSendRequest
};