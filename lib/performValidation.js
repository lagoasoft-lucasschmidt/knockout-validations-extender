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
  var children, container, defaultMessage, observableValue, parent, promises, resetValidation, rules, target, translator, validateChildren, validationMethods;
  validationMethods = (options != null ? options.validationMethods : void 0) || {};
  translator = (options != null ? options.translator : void 0) || (function() {
    throw new Error("translator should have been set");
  })();
  defaultMessage = (options != null ? options.defaultMessage : void 0) || "Field is not valid";
  rules = (options != null ? options.rules : void 0) || {};
  target = (options != null ? options.target : void 0) || (function() {
    throw new Error("target is required");
  })();
  observableValue = target();
  children = (options != null ? options.children : void 0) || [];
  resetValidation = options != null ? options.resetValidation : void 0;
  validateChildren = options != null ? options.validateChildren : void 0;
  parent = options != null ? options.parent : void 0;
  container = options != null ? options.container : void 0;
  if (resetValidation) {
    target.resetValidation();
  }
  promises = [];
  promises.push(performOwnValidations(rules, validationMethods, observableValue, defaultMessage, translator, parent, container));
  if (validateChildren) {
    promises.push(performChildrenValidations(children, resetValidation, target));
  } else {
    promises.push(newPromise([]));
  }
  return newPromise(promises).spread(function(ownErrors) {
    if (callback) {
      return callback(ownErrors);
    } else {
      return ownErrors;
    }
  }).fail(function(error) {
    logger.error(error);
    return callback([defaultMessage]);
  }).done();
};

performOwnValidations = function(rules, validationMethods, observableValue, defaultMessage, translator, parent, container) {
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
    var entry, handler, promise;
    if (!(stack != null ? stack.length : void 0)) {
      return newPromise();
    }
    entry = stack.pop();
    rule = entry.rule;
    ruleOptions = entry.ruleOptions;
    promise = createValidationPromise(rule, ruleOptions, validationMethods, observableValue, parent, container);
    if (!promise) {
      return executeNextValidation();
    } else {
      handler = function(result) {
        var msg, _ref;
        if (!result) {
          msg = (ruleOptions != null ? ruleOptions.message : void 0) || ((_ref = validationMethods[rule]) != null ? _ref.defaultMessage : void 0) || defaultMessage;
          errors.push(translator(msg, ruleOptions));
        }
        if ((errors != null ? errors.length : void 0) && observableOptions.stopOnFirstError) {
          return newPromise();
        } else {
          return executeNextValidation();
        }
      };
      return promise.then(handler, function(err) {
        logger.error(err);
        return handler(false);
      });
    }
  };
  return executeNextValidation().then(function() {
    return _.filter(errors, function(error) {
      return error != null;
    });
  });
};

performChildrenValidations = function(children, resetValidation, parent) {
  var child, childDescriptor, promises, _i, _len;
  promises = [];
  for (_i = 0, _len = children.length; _i < _len; _i++) {
    childDescriptor = children[_i];
    child = childDescriptor.child;
    if (_.isFunction(child != null ? child.validate : void 0)) {
      promises.push(Promise.nfcall(child.validate, {
        reset: resetValidation,
        validateChildren: false,
        parent: parent,
        container: childDescriptor.container
      }));
    }
  }
  if (!(promises != null ? promises.length : void 0)) {
    return newPromise([]);
  }
  return newPromise(promises).all();
};

createValidationPromise = function(rule, ruleOptions, validationMethods, observableValue, parent, container) {
  var async, ruleOptsOrFn;
  ruleOptsOrFn = validationMethods[rule];
  if (_.isFunction(ruleOptsOrFn)) {
    return Promise.fcall(ruleOptsOrFn, {
      value: observableValue,
      validationOptions: ruleOptions,
      parent: parent,
      container: container
    });
  } else if (_.isFunction(ruleOptsOrFn != null ? ruleOptsOrFn.fn : void 0)) {
    async = ruleOptsOrFn.async || false;
    if (!async) {
      return Promise.fcall(ruleOptsOrFn.fn, {
        value: observableValue,
        validationOptions: ruleOptions,
        parent: parent,
        container: container
      });
    } else {
      return Promise.nfcall(ruleOptsOrFn.fn, {
        value: observableValue,
        validationOptions: ruleOptions,
        parent: parent,
        container: container
      });
    }
  } else {
    if (rule !== "options") {
      logger.warn("Validation Method with name " + rule + " doesnt exist");
    }
    return void 0;
  }
};
