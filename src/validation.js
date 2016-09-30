// validation.js
// ==========
 
// Validate each of the input parameters for send request
function validateSendRequestInput(username, password, url, method) {
  err = null;
  err = validateFieldExistence(err, 'user-name', username);
  err = validateFieldExistence(err, 'password', password);

  if (!url) {
    err = validateFieldExistence(err, 'url', url);
  } else if  (url.toLowerCase().indexOf('https://') != 0) {
    console.log('url index of https = ' + url.toLowerCase().indexOf('https://'));
    err = addValidationError(err, 'URL must start with \'https\'');
  }

  err = validateMethod(err, method);
  if (err) {
    throw err;
  }
}

// Creates an error if one does not already exist - adds the code for Invalid Parameter.
// Appends the message to the existing message if necessary.
function addValidationError(err, message) {
  if (!err) {
    err = new Error(message);
    err.code = 'EINVAL';
  } else {
    err.message += '; ' + message;
  }
  return err;
}

function validateFieldExistence(err, fieldName, field) {
  if (!field) {
    err = addValidationError(err, fieldName + ' was not provided');
  }
  return err;
}

function validateMethod(err, method) {
  if (!method) {
    err = addValidationError(err, 'method was not provided');
  } else if (method.toLowerCase() != 'get' && method.toLowerCase() != 'post') {
    err = addValidationError(err, 'GET and POST are currently the only supported methods');
  }
  
  return err;
}

module.exports = {
  validateSendRequestInput: validateSendRequestInput
};