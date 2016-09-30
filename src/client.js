// client.js
// The client module is responsible for sending requests from the PWS server to remote servers.  In other words
// this module is for when the service is acting as the client.
// ======
var https = require('https');
var fetch = require('node-fetch');
var props = require('./properties.js');
var HttpsProxyAgent = require('https-proxy-agent');

var proxyServerHost = props.get('PROXY_SERVER_HOST');
var proxyServerPort = props.get('PROXY_SERVER_PORT');

// Send a request to a remote server.
function sendRequest(useProxy, callback, res, requestOptions, body, loggingOptions) {
  console.log('requestOptions = ' + JSON.stringify(requestOptions));
  requestOptions.headers['Accept'] = 'application/xml';
  requestOptions.headers['Content-Type'] = 'application/xml';
  
  url = 'https://' + requestOptions.host + requestOptions.path;
  if (proxyServerHost && proxyServerPort && requestOptions.host.indexOf('concurasp.com') == -1) {
    proxyUrl = proxyServerHost + ':' + proxyServerPort;
    loggingOptions.callouts_data.proxy = proxyUrl;
    requestOptions['agent'] = new HttpsProxyAgent(proxyUrl);
  }
  
  var outboundRequest = https.request(requestOptions, function(response) {
    respBody = '';

    response.setEncoding('utf8');
    response.on('data', function(chunk) {
      respBody += chunk;
    });

    response.on('end', function() {
      callback(res, response.statusCode, respBody, loggingOptions);
    })
  });

  // On an error try to log the proper response code
  outboundRequest.on('error', function(e) {
    responseCode = null;
    if (e.code == 'ENOTFOUND') {
      responseCode = 404;
    } else {
      responseCode = 500;
    }
    
    loggingOptions.callouts_data.response_error_code = responseCode;
    loggingOptions.callouts_data.response_exception_code = e.code;
    callback(res, responseCode, e, loggingOptions);
  });

  if (body) {
    outboundRequest.write(body);
  }
  outboundRequest.end();
};

// Expose functions for developer consumption
module.exports = {
  sendRequest: sendRequest
};