var basicOptions, defaultMessage, extender, ko, translatorFn, validationMethods, _;

ko = require('knockout');

_ = require('lodash');

extender = require('./extender');

validationMethods = {};

defaultMessage = "Field is not valid";

translatorFn = function(m) {
  return m;
};

module.exports.registerValidationMethods = function(otherValidationMethods) {
  validationMethods = _.extend(validationMethods, otherValidationMethods);
  return module.exports;
};

module.exports.setDefaultMessage = function(msg) {
  defaultMessage = msg;
  return module.exports;
};

module.exports.setTranslator = function(fn) {
  return translatorFn = fn;
};

basicOptions = {
  getValidationMethods: function() {
    return validationMethods;
  },
  live: false,
  translator: function(m, validationOptions) {
    return translatorFn(m, validationOptions);
  }
};

ko.extenders.validations = extender(basicOptions);

ko.extenders.validationsLive = extender(_.extend(_.clone(basicOptions), {
  live: true
}));

ko.extenders.validationsAlwaysLive = extender(_.extend(_.clone(basicOptions), {
  live: true,
  alwaysLive: true
}));
