var express = require('express');
var requestId = require('request-id/express');
var bodyParser = require('body-parser');
require('body-parser-xml')(bodyParser);
var app = express();

var props = require('./properties.js');
var logging = require('./logging.js');
var proxy = require('./proxy-handler.js');

var port = props.get('SERVER_PORT');

// Create an xml parser for legacy requests to proxy controller
app.use(bodyParser.xml({
  limit: '1MB',
  xmlParseOptions: {
    normalize: true,
    normalizeTags: true,
    explicitArray: false
  }
}));

// Use a JSON parser - node will automatically detect the type of the request
app.use(bodyParser.json());

// Uses the requestId package to automatically pull the correlation id off the request and add it to the response.
// Creates a correlation id if one is not passed in.
app.use(requestId({
  resHeader: props.get('CORRELATION_ID_KEY'),
  reqHeader: props.get('CORRELATION_ID_KEY')
}));

// Logs the request as it comes in
app.use(function(req, res, next) {
  if (req.url != '/health') {
    logging.info(req, res);
  }
  next();
});

// Map the sendrequest path to the proxy handler
app.post('/sendrequest', function(req, res) {
  requestOptions = proxy.handleSendRequest(req, res);
});

// Map the health check to respond with a 200
app.get('/health', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send({
    health: "ok"
  });
});

// Startup the server and listen for incoming requests!
app.listen(port, function() {
  startupMessage = 'Server started, up and listening on port ' + port;
  options = { description: startupMessage, correlation_id: "Server Startup"};
  logging.info(null, null, options);
})
