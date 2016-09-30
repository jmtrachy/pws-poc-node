var expect    = require("chai").expect;
var validator = require("../src/validation.js");

describe('Validation Test Suite', function() {
  describe('Validate Send Request Input', function () {
    it('Validates a request with valid input', function() {
      validator.validateSendRequestInput('username', 'password', 'https://test.concur.com', 'GET');
    });
    
    it('Validates a request with no valid input', function() {
      try {
        validator.validateSendRequestInput(null, '', '', '');
      } catch (err) {
        expect(err.code).to.deep.equal('EINVAL');
      }
    });
    
    it('Validates a request with no user-name', function() {
      try {
        validator.validateSendRequestInput(null, 'password', 'https://test.concur.com', 'GET');
      } catch (err) {
        expect(err.code).to.deep.equal('EINVAL');
      }
    });
    
    it('Validates a request with no password', function() {
      try {
        validator.validateSendRequestInput('user-name', '', 'https://test.concur.com', 'GET');
      } catch (err) {
        expect(err.code).to.deep.equal('EINVAL');
      }
    });
    
    it('Validates a request with a non-https url', function() {
      try {
        validator.validateSendRequestInput('user-name', 'password', 'http://test.concur.com', 'GET');
      } catch (err) {
        expect(err.code).to.deep.equal('EINVAL');
      }
    });
    
    it('Validates a request with no url', function() {
      try {
        validator.validateSendRequestInput('user-name', 'password', '', 'GET');
      } catch (err) {
        expect(err.code).to.deep.equal('EINVAL');
      }
    });
      
    it('Validates a request with no method', function() {
      try {
        validator.validateSendRequestInput('user-name', 'password', 'https://test.concur.com', '');
      } catch (err) {
        expect(err.code).to.deep.equal('EINVAL');
      }
    });
    
    it('Validates a request with an invalid method', function() {
      try {
        validator.validateSendRequestInput('user-name', 'password', 'https://test.concur.com', 'DEL');
      } catch (err) {
        expect(err.code).to.deep.equal('EINVAL');
      }
    });
  });
});