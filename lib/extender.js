var ko, performValidation, utils, _;

_ = require('lodash');

ko = require('knockout');

utils = require('./utils');

performValidation = require('./performValidation');

module.exports = function(options) {
  var alwaysLive, getValidationMethods, live;
  live = (options != null ? options.live : void 0) || false;
  alwaysLive = (options != null ? options.alwaysLive : void 0) || false;
  getValidationMethods = options.getValidationMethods;
  return function(target, rules) {
    var allCalculatedErrors, allErrors, allManualErrors, children, childrenCalculatedErrors, childrenErrors, childrenManualErrors, hasLiveStarted, isValid, ownCalculatedErrors, ownErrors, ownManualErrors;
    hasLiveStarted = false;
    rules = rules || {};
    if (!ko.isObservable(rules)) {
      rules = ko.observable(rules);
    }
    ownCalculatedErrors = ko.observableArray();
    ownManualErrors = ko.observableArray();
    ownErrors = ko.computed(function() {
      return ownCalculatedErrors().concat(ownManualErrors());
    });
    children = ko.computed(function() {
      var array;
      array = [];
      utils.iterateChildrenObservable(target, function(child) {
        return array.push(child);
      });
      return array;
    });
    childrenCalculatedErrors = ko.computed(function() {
      return utils.collectChildrenObservableErrors(children(), 'getAllCalculatedErrors');
    });
    childrenManualErrors = ko.computed(function() {
      return utils.collectChildrenObservableErrors(children(), 'getAllManualErrors');
    });
    childrenErrors = ko.computed(function() {
      return childrenCalculatedErrors().concat(childrenManualErrors());
    });
    allCalculatedErrors = ko.computed(function() {
      return ownCalculatedErrors().concat(childrenCalculatedErrors());
    });
    allManualErrors = ko.computed(function() {
      return ownManualErrors().concat(childrenManualErrors());
    });
    allErrors = ko.computed(function() {
      return allCalculatedErrors().concat(allManualErrors());
    });
    isValid = ko.computed(function() {
      return allErrors().length === 0;
    });
    target.isValid = isValid;
    target.isntValid = ko.computed(function() {
      return !target.isValid();
    });
    target.getAllErrors = allErrors;
    target.getAllCalculatedErrors = allCalculatedErrors;
    target.getAllManualErrors = allManualErrors;
    target.getOwnErrors = ownErrors;
    target.getOwnCalculatedErrors = ownCalculatedErrors;
    target.getOwnManualErrors = ownManualErrors;
    target.hasOwnErrors = ko.computed(function() {
      var _ref;
      return ((_ref = target.getOwnErrors()) != null ? _ref.length : void 0) > 0;
    });
    target.getChildrenErrors = childrenErrors;
    target.getChildrenCalculatedErrors = childrenCalculatedErrors;
    target.getChildrenManualErrors = childrenManualErrors;
    target.errors = target.getAllErrors;
    target.joinedErrors = function(separator) {
      return ko.computed(function() {
        return target.errors().join(separator);
      });
    };
    target.resetValidation = function() {
      var child, _i, _len, _ref, _results;
      ownCalculatedErrors([]);
      ownManualErrors([]);
      _ref = children();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        if (_.isFunction(child != null ? child.validate : void 0)) {
          _results.push(child.resetValidation());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    target.validate = function(opts, cb) {
      if (_.isFunction(opts)) {
        cb = opts;
        opts = {};
      }
      cb = cb || function() {};
      return performValidation({
        validationMethods: getValidationMethods(),
        rules: ko.unwrap(rules),
        target: target,
        children: children(),
        resetValidation: (opts != null ? opts.reset : void 0) || false,
        validateChildren: (opts != null ? opts.validateChildren : void 0) || true
      }, function(ownErrors) {
        ownCalculatedErrors(_.uniq(ownErrors));
        return cb(target.isValid());
      });
    };
    target.hasValidation = function(rule) {
      return ko.computed(function() {
        return rules()[rule] != null;
      });
    };
    target.removeValidation = function(rule) {
      var allRules;
      allRules = rules();
      delete allRules[rule];
      rules(allRules);
      return target;
    };
    target.validation = function(newRule, options) {
      if (!newRule) {
        return target;
      }
      rules()[newRule] = options || {};
      return target;
    };
    if (live) {
      rules.subscribe(function(newRule) {
        return _.defer(function() {
          if (hasLiveStarted) {
            return target.validate();
          }
        });
      });
      target.subscribe(function(newValue) {
        return _.defer(function() {
          return target.validate();
        });
      });
      if (alwaysLive) {
        _.defer(function() {
          hasLiveStarted = true;
          return target.validate();
        });
      }
    }
    return target;
  };
};
