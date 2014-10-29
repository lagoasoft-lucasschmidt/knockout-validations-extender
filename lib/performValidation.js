var Promise, createValidationPromise, defaultValidationObservableOptions, ko, logger, newPromise, performChildrenValidations, performOwnValidations, performValidation, _;

_ = require('lodash');

ko = require('knockout');

logger = require('loglevel');

Promise = require('promiz');

newPromise = require('./utils').newPromise;

defaultValidationObservableOptions = {
  stopOnFirstError: false
};

module.exports = performValidation = function(options, callback) {
  var children, defaultMessage, observableValue, promises, resetValidation, rules, target, validateChildren, validationMethods;
  validationMethods = (options != null ? options.validationMethods : void 0) || {};
  defaultMessage = (options != null ? options.defaultMessage : void 0) || "Field is not valid";
  rules = (options != null ? options.rules : void 0) || {};
  target = (options != null ? options.target : void 0) || (function() {
    throw new Error("target is required");
  })();
  observableValue = target();
  children = (options != null ? options.children : void 0) || [];
  resetValidation = options != null ? options.resetValidation : void 0;
  validateChildren = options != null ? options.validateChildren : void 0;
  if (resetValidation) {
    target.resetValidation();
  }
  promises = [];
  promises.push(performOwnValidations(rules, validationMethods, observableValue, defaultMessage));
  if (validateChildren) {
    promises.push(performChildrenValidations(children, resetValidation));
  } else {
    promises.push(newPromise([]));
  }
  return newPromise(promises).spread(function(ownErrors) {
    if (callback) {
      return callback(ownErrors);
    } else {
      return ownErrors;
    }
  }).fail((function(_this) {
    return function(error) {
      logger.error(error);
      return callback([defaultMessage]);
    };
  })(this)).done();
};

performOwnValidations = function(rules, validationMethods, observableValue, defaultMessage) {
  var errors, executeNextValidation, observableOptions, rule, ruleOptions, stack;
  observableOptions = _.clone(defaultValidationObservableOptions);
  if (_.isObject(rules != null ? rules.options : void 0)) {
    observableOptions = _.extend(observableOptions, rules.options);
  }
  errors = [];
  stack = ((function() {
    var _results;
    _results = [];
    for (rule in rules) {
      ruleOptions = rules[rule];
      _results.push({
        rule: rule,
        ruleOptions: ruleOptions
      });
    }
    return _results;
  })()).reverse();
  executeNextValidation = function() {
    var entry, promise;
    if (!(stack != null ? stack.length : void 0)) {
      return newPromise();
    }
    entry = stack.pop();
    rule = entry.rule;
    ruleOptions = entry.ruleOptions;
    promise = createValidationPromise(rule, ruleOptions, validationMethods, observableValue);
    if (!promise) {
      return executeNextValidation();
    } else {
      return promise.then(function(result) {
        var _ref;
        if (!result) {
          errors.push((ruleOptions != null ? ruleOptions.message : void 0) || ((_ref = validationMethods[rule]) != null ? _ref.defaultMessage : void 0) || defaultMessage);
        }
        if ((errors != null ? errors.length : void 0) && observableOptions.stopOnFirstError) {
          return newPromise();
        } else {
          return executeNextValidation();
        }
      });
    }
  };
  return executeNextValidation().then(function() {
    return _.filter(errors, function(error) {
      return error != null;
    });
  });
};

performChildrenValidations = function(children, resetValidation) {
  var child, promises, _i, _len;
  promises = [];
  for (_i = 0, _len = children.length; _i < _len; _i++) {
    child = children[_i];
    if (_.isFunction(child != null ? child.validate : void 0)) {
      promises.push(Promise.nfcall(child.validate, {
        reset: resetValidation,
        validateChildren: false
      }));
    }
  }
  if (!(promises != null ? promises.length : void 0)) {
    return newPromise([]);
  }
  return newPromise(promises).all();
};

createValidationPromise = function(rule, ruleOptions, validationMethods, observableValue) {
  var async, ruleOptsOrFn;
  ruleOptsOrFn = validationMethods[rule];
  if (_.isFunction(ruleOptsOrFn)) {
    return Promise.fcall(ruleOptsOrFn, {
      value: observableValue,
      validationOptions: ruleOptions
    });
  } else if (_.isFunction(ruleOptsOrFn != null ? ruleOptsOrFn.fn : void 0)) {
    async = ruleOptsOrFn.async || false;
    if (!async) {
      return Promise.fcall(ruleOptsOrFn.fn, {
        value: observableValue,
        validationOptions: ruleOptions
      });
    } else {
      return Promise.nfcall(ruleOptsOrFn.fn, {
        value: observableValue,
        validationOptions: ruleOptions
      });
    }
  } else {
    if (rule !== "options") {
      logger.warn("Validation Method with name " + rule + " doesnt exist");
    }
    return void 0;
  }
};
