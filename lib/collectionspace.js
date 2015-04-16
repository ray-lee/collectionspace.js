'use strict';

var Q = require('q');
var request = require('superagent');

var DEFAULT_HTTP_PORT = 80;

var DEFAULT_OPTIONS = {
  host: '',
  port: 8180,
  ssl: false,
  tenant: 'core'
};

var API_PATH = '/collectionspace/tenant';
var LOGIN_PATH = '/login';
var LOGOUT_PATH = '/logout';
var LOGIN_STATUS_PATH = '/loginstatus';
var RECORD_PATH = '/basic';
var VOCABULARY_PATH = '/termlist';

var CollectionSpace = function(options) {
  options = options || {};
  
  for (var option in DEFAULT_OPTIONS) {
    if (!(option in options)) {
      options[option] = DEFAULT_OPTIONS[option];
    }
  }
  
  if (options.host) {
    this._baseUrl = (options.ssl ? 'https' : 'http') + '://' + options.host + ((options.port == DEFAULT_HTTP_PORT) ? '' : ':' + options.port);
  }
  else {
    this._baseUrl = '';
  }
  
  this._baseUrl += API_PATH + '/' + options.tenant;
  this.connected = false;
  this.username = null;
};

CollectionSpace.prototype.connect = function(username, password) {
  var deferred = Q.defer();
  
  if (this.connected && this.username === username) {
    deferred.resolve(true);
    return deferred.promise;
  }
  
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
        // Confirm login status.
        
        this._getLoginStatus()
          .then(function(data) {
            if ('login' in data && data.login) {
              this.username = username;
              this.connected = true;
              
              deferred.resolve(true);
            }
            else {
              error = new Error();
              error.code = 'ELOGINFAILED';
              error.message = 'login failed (' + error.code + ')';
            
              throw(error);
            }
          }.bind(this))
          .then(null, function(error) {
            deferred.reject(error);
          });
      }
    }.bind(this));
    
  return deferred.promise;
};

CollectionSpace.prototype._getLoginStatus = function() {
  var deferred = Q.defer();
  
  this._agent
    .get(this._baseUrl + LOGIN_STATUS_PATH)
    .end(function(error, response) {
      if (error) {
        deferred.reject(error);
      }
      else {
        var data = getResponseData(response);
        
        deferred.resolve(data);
      }
    }.bind(this));
    
  return deferred.promise;
};

CollectionSpace.prototype.disconnect = function() {
  var deferred = Q.defer();

  if (!this.connected) {
    var error = new Error();
    error.code = 'ENOTCONNECTED';
    error.message = 'not connected (' + error.code + ')';
    
    deferred.reject(error);
  }
  else {
    this._agent
      .get(this._baseUrl + LOGOUT_PATH)
      .end(function(error, response) {
        if (error) {
          deferred.reject(error);
        }
        else {
          // Confirm login status.
      
          this._getLoginStatus()
            .then(function(data) {
              if ('login' in data && !data.login) {
                delete this._agent;
                
                this.username = null;
                this.connected = false;
            
                deferred.resolve(true);
              }
              else {
                error = new Error('logout failed');
                error.code = 'ELOGOUTFAILED';
        
                throw(error);
              }
            }.bind(this))
            .then(null, function(error) {
              deferred.reject(error);
            });
        }
      }.bind(this));
  }
  
  return deferred.promise;
};

CollectionSpace.prototype.getRecord = function(type, csid) {
  var deferred = Q.defer();

  if (!this.connected) {
    var error = new Error();
    error.code = 'ENOTCONNECTED';
    error.message = 'not connected (' + error.code + ')';
    
    deferred.reject(error);
  }
  else {
    if (type === 'collectionobject') {
      // Convert to app layer name.
      type = 'cataloging';
    }
    
    this._agent
      .get(this._baseUrl + RECORD_PATH + '/' + type + '/' + csid)
      .end(function(error, response) {
        if (error) {
          deferred.reject(error);
        }
        else {
          var data;
          
          try {
            data = getResponseData(response);
          }
          catch(error) {
            deferred.reject(error);
          }
          
          deferred.resolve(data);
        }
      }.bind(this));
  }
  
  return deferred.promise;
};

CollectionSpace.prototype.getVocabulary = function(shortID) {
   var deferred = Q.defer();

   if (!this.connected) {
     var error = new Error();
     error.code = 'ENOTCONNECTED';
     error.message = 'not connected (' + error.code + ')';
    
     deferred.reject(error);
   }
   else {
     this._agent
       .get(this._baseUrl + VOCABULARY_PATH + '/' + shortIDToCSID(shortID))
       .end(function(error, response) {
         if (error) {
           deferred.reject(error);
         }
         else {
           var data;
          
           try {
             data = getResponseData(response);
           }
           catch(error) {
             deferred.reject(error);
           }
           
           deferred.resolve(data);
         }
       }.bind(this));
   }
  
   return deferred.promise;
};

var shortIDToCSID = function(shortID) {
   return("urn:cspace:name(" + shortID + ")");
};

var getResponseData = function(response) {
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
      message = data.messages[0].message.trim();
    }
    
    var error = new Error();
    error.code = 'EAPI';
    error.csid = data.csid;
    error.message = message + ' (' + error.code + ')';

  
    throw(error);
  }
  
  return data;
};

module.exports = CollectionSpace;