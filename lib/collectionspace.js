var Q = require('q');
var request = require('superagent');
var extend = require('extend');

var DEFAULT_HTTP_PORT = 80;

var DEFAULT_OPTIONS = {
  host: '',
  port: 8180,
  ssl: false,
  tenant: 'core'
};

var API_PATH = '/collectionspace/tenant';
var LOGIN_PATH = '/login';
var RECORD_PATH = '/basic';

var CollectionSpace = function(options) {
  options = extend(true, {}, DEFAULT_OPTIONS, options || {});
  
  if (options.host) {
    this._baseUrl = (options.ssl ? 'https' : 'http') + '://' + options.host + ((options.port == DEFAULT_HTTP_PORT) ? '' : ':' + options.port);
  }
  else {
    this._baseUrl = '';
  }
  
  this._baseUrl += API_PATH + '/' + options.tenant;
  this.connected = false;
};

CollectionSpace.prototype.connect = function(username, password) {
  var deferred = Q.defer();
  
  var credentials = {
    userid: username,
    password: password
  };

  // In node.js, get an agent, and use it for all requests so it will maintain the session cookie.
  // In the browser, request.agent() does not exist. There is only one agent, the browser.
  this._agent = ('agent' in request) ? request.agent() : request;
  
  this._agent
    .post(this._baseUrl + LOGIN_PATH)
    .type('form')
    .send(credentials)
    .end(function(error, response) {
      if (error) {
        delete this._agent;
        
        deferred.reject(error);
      }
      else {
        // There isn't a good way to tell if login was successful.
        // If not, the app layer redirects back to the login page.
        // Try to detect this.
        
        if (response.text.indexOf('Login') > 0) {
          error = new Error('login failed');
          error.code = 'ELOGINFAILED';

          deferred.reject(error);
        }
        else {
          this.username = username;
          this.connected = true;

          deferred.resolve();
        }
      }
    }.bind(this));
    
    return deferred.promise;
};

CollectionSpace.prototype.disconnect = function() {
  delete this._agent;
  delete this.username;
  
  this.connected = false;
};

CollectionSpace.prototype.getRecord = function(type, csid) {
  var deferred = Q.defer();

  if (!this.connected) {
    error = new Error('not connected');
    error.code = 'ENOTCONNECTED';
    
    deferred.reject(error);
  }
  else {
    this._agent
      .get(this._baseUrl + RECORD_PATH + '/' + type + '/' + csid)
      .end(function(error, response) {
        if (error) {
          deferred.reject(error);
        }
        else {
          var data;
          
          if ('body' in response && response.body != null) {
            // SuperAgent already parsed a known content type.
            data = response.body;
          }
          else if (response.type == 'text/json') {
            // SuperAgent doesn't recognize text/json, only application/json, so handle this.
            data = JSON.parse(response.text);
          }
          else {
            // Not a parsable type. Just return the text.
            data = response.text;
          }
          
          if (data.isError) {
            // Handle app layer error payloads.
            var message = '';
          
            if (data.messages.length > 0) {
              message = data.messages[0].message;
            }
          
            error = new Error(message);
            error.code = 'EAPI';
            error.csid = data.csid;
          
            deferred.reject(error);
          }
          else {
            deferred.resolve(data);
          }
        }
      }.bind(this));
  }
  
  return deferred.promise;
};

module.exports = CollectionSpace;