!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var n;"undefined"!=typeof window?n=window:"undefined"!=typeof global?n=global:"undefined"!=typeof self&&(n=self),n.knockoutValidationsExtender=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
(function (global){
var ko, performValidation, utils, _;

_ = (typeof window !== "undefined" ? window. _ : typeof global !== "undefined" ? global. _ : null);

ko = (typeof window !== "undefined" ? window.ko : typeof global !== "undefined" ? global.ko : null);

utils = _dereq_('./utils');

performValidation = _dereq_('./performValidation');

module.exports = function(options) {
  var alwaysLive, getValidationMethods, live, translator;
  live = (options != null ? options.live : void 0) || false;
  alwaysLive = (options != null ? options.alwaysLive : void 0) || false;
  getValidationMethods = options.getValidationMethods;
  translator = options != null ? options.translator : void 0;
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
      var childDescriptor, _i, _len, _ref, _ref1, _results;
      ownCalculatedErrors([]);
      ownManualErrors([]);
      _ref = children();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        childDescriptor = _ref[_i];
        if (_.isFunction(childDescriptor != null ? (_ref1 = childDescriptor.child) != null ? _ref1.validate : void 0 : void 0)) {
          _results.push(childDescriptor.child.resetValidation());
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
        validateChildren: (opts != null ? opts.validateChildren : void 0) || true,
        translator: translator,
        parent: (opts != null ? opts.parent : void 0) || null,
        container: (opts != null ? opts.container : void 0) || null
      }, function(ownErrors) {
        ownCalculatedErrors(_.uniq(ownErrors));
        cb(target.isValid());
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
      var allRules;
      if (!newRule) {
        return target;
      }
      allRules = rules();
      allRules[newRule] = options || {};
      rules(allRules);
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

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./performValidation":3,"./utils":4}],2:[function(_dereq_,module,exports){
(function (global){
var basicOptions, defaultMessage, extender, ko, translatorFn, validationMethods, _;

ko = (typeof window !== "undefined" ? window.ko : typeof global !== "undefined" ? global.ko : null);

_ = (typeof window !== "undefined" ? window. _ : typeof global !== "undefined" ? global. _ : null);

extender = _dereq_('./extender');

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

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./extender":1}],3:[function(_dereq_,module,exports){
(function (global){
var Promise, createValidationPromise, defaultValidationObservableOptions, ko, logger, newPromise, performChildrenValidations, performOwnValidations, performValidation, _;

_ = (typeof window !== "undefined" ? window. _ : typeof global !== "undefined" ? global. _ : null);

ko = (typeof window !== "undefined" ? window.ko : typeof global !== "undefined" ? global.ko : null);

logger = _dereq_('loglevel');

Promise = _dereq_('promiz');

newPromise = _dereq_('./utils').newPromise;

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

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./utils":4,"loglevel":5,"promiz":6}],4:[function(_dereq_,module,exports){
(function (global){
var Promise, collectChildrenErrors, collectChildrenObservableErrors, isObservableArray, iterateChildrenObservable, ko, newPromise, _;

_ = (typeof window !== "undefined" ? window. _ : typeof global !== "undefined" ? global. _ : null);

ko = (typeof window !== "undefined" ? window.ko : typeof global !== "undefined" ? global.ko : null);

Promise = _dereq_('promiz');

module.exports.isObservableArray = isObservableArray = function(obj) {
  return ko.isObservable(obj) && !(obj.destroyAll === void 0);
};

module.exports.newPromise = newPromise = function(value) {
  var deferred;
  deferred = Promise.defer();
  setTimeout((function() {
    return deferred.resolve(value);
  }), 0);
  return deferred;
};

module.exports.collectChildrenErrors = collectChildrenErrors = function(childrenErrors) {
  var childErrors, errorsToReturn, recursiveCollectChildrenErrors, _i, _len;
  errorsToReturn = [];
  recursiveCollectChildrenErrors = function(childErrors) {
    var otherChildErrors, _i, _len, _ref, _results;
    errorsToReturn = errorsToReturn.concat(childErrors.ownErrors);
    _ref = childErrors.childrenErrors;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      otherChildErrors = _ref[_i];
      _results.push(recursiveCollectChildrenErrors(otherChildErrors));
    }
    return _results;
  };
  for (_i = 0, _len = childrenErrors.length; _i < _len; _i++) {
    childErrors = childrenErrors[_i];
    recursiveCollectChildrenErrors(childErrors);
  }
  return errorsToReturn;
};

module.exports.collectChildrenObservableErrors = collectChildrenObservableErrors = function(children, errorsFnName) {
  var childDescriptor, childrenObservable, errors, _i, _len;
  errors = [];
  for (_i = 0, _len = children.length; _i < _len; _i++) {
    childDescriptor = children[_i];
    childrenObservable = childDescriptor.child;
    if (_.isFunction(childrenObservable != null ? childrenObservable[errorsFnName] : void 0)) {
      errors = errors.concat(childrenObservable[errorsFnName]());
    }
  }
  return errors;
};

module.exports.iterateChildrenObservable = iterateChildrenObservable = function(target, iterator) {
  var iteratePossibleChildObservable, key, observableValue, possibleObservable, _i, _j, _len, _len1, _ref, _results, _results1;
  iteratePossibleChildObservable = function(possibleObservable) {
    if (ko.isObservable(possibleObservable) || isObservableArray(possibleObservable)) {
      return iterator({
        child: possibleObservable,
        container: target
      });
    } else if (_.isArray(possibleObservable) || _.isObject(possibleObservable)) {
      return iterateChildrenObservable(possibleObservable, iterator);
    }
  };
  observableValue = ko.unwrap(target);
  if (_.isArray(observableValue)) {
    _results = [];
    for (_i = 0, _len = observableValue.length; _i < _len; _i++) {
      possibleObservable = observableValue[_i];
      _results.push(iteratePossibleChildObservable(possibleObservable));
    }
    return _results;
  } else if (_.isObject(observableValue)) {
    _ref = _.keys(observableValue);
    _results1 = [];
    for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
      key = _ref[_j];
      if (observableValue.hasOwnProperty(key)) {
        _results1.push(iteratePossibleChildObservable(observableValue[key]));
      }
    }
    return _results1;
  }
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"promiz":6}],5:[function(_dereq_,module,exports){
/*
* loglevel - https://github.com/pimterry/loglevel
*
* Copyright (c) 2013 Tim Perry
* Licensed under the MIT license.
*/
(function (root, definition) {
    if (typeof module === 'object' && module.exports && typeof _dereq_ === 'function') {
        module.exports = definition();
    } else if (typeof define === 'function' && typeof define.amd === 'object') {
        define(definition);
    } else {
        root.log = definition();
    }
}(this, function () {
    var self = {};
    var noop = function() {};
    var undefinedType = "undefined";

    function realMethod(methodName) {
        if (typeof console === undefinedType) {
            return false; // We can't build a real method without a console to log to
        } else if (console[methodName] !== undefined) {
            return bindMethod(console, methodName);
        } else if (console.log !== undefined) {
            return bindMethod(console, 'log');
        } else {
            return noop;
        }
    }

    function bindMethod(obj, methodName) {
        var method = obj[methodName];
        if (typeof method.bind === 'function') {
            return method.bind(obj);
        } else {
            try {
                return Function.prototype.bind.call(method, obj);
            } catch (e) {
                // Missing bind shim or IE8 + Modernizr, fallback to wrapping
                return function() {
                    return Function.prototype.apply.apply(method, [obj, arguments]);
                };
            }
        }
    }

    function enableLoggingWhenConsoleArrives(methodName, level) {
        return function () {
            if (typeof console !== undefinedType) {
                replaceLoggingMethods(level);
                self[methodName].apply(self, arguments);
            }
        };
    }

    var logMethods = [
        "trace",
        "debug",
        "info",
        "warn",
        "error"
    ];

    function replaceLoggingMethods(level) {
        for (var i = 0; i < logMethods.length; i++) {
            var methodName = logMethods[i];
            self[methodName] = (i < level) ? noop : self.methodFactory(methodName, level);
        }
    }

    function persistLevelIfPossible(levelNum) {
        var levelName = (logMethods[levelNum] || 'silent').toUpperCase();

        // Use localStorage if available
        try {
            window.localStorage['loglevel'] = levelName;
            return;
        } catch (ignore) {}

        // Use session cookie as fallback
        try {
            window.document.cookie = "loglevel=" + levelName + ";";
        } catch (ignore) {}
    }

    function loadPersistedLevel() {
        var storedLevel;

        try {
            storedLevel = window.localStorage['loglevel'];
        } catch (ignore) {}

        if (typeof storedLevel === undefinedType) {
            try {
                storedLevel = /loglevel=([^;]+)/.exec(window.document.cookie)[1];
            } catch (ignore) {}
        }
        
        if (self.levels[storedLevel] === undefined) {
            storedLevel = "WARN";
        }

        self.setLevel(self.levels[storedLevel]);
    }

    /*
     *
     * Public API
     *
     */

    self.levels = { "TRACE": 0, "DEBUG": 1, "INFO": 2, "WARN": 3,
        "ERROR": 4, "SILENT": 5};

    self.methodFactory = function (methodName, level) {
        return realMethod(methodName) ||
               enableLoggingWhenConsoleArrives(methodName, level);
    };

    self.setLevel = function (level) {
        if (typeof level === "string" && self.levels[level.toUpperCase()] !== undefined) {
            level = self.levels[level.toUpperCase()];
        }
        if (typeof level === "number" && level >= 0 && level <= self.levels.SILENT) {
            persistLevelIfPossible(level);
            replaceLoggingMethods(level);
            if (typeof console === undefinedType && level < self.levels.SILENT) {
                return "No console available for logging";
            }
        } else {
            throw "log.setLevel() called with invalid level: " + level;
        }
    };

    self.enableAll = function() {
        self.setLevel(self.levels.TRACE);
    };

    self.disableAll = function() {
        self.setLevel(self.levels.SILENT);
    };

    // Grab the current global log variable in case of overwrite
    var _log = (typeof window !== undefinedType) ? window.log : undefined;
    self.noConflict = function() {
        if (typeof window !== undefinedType &&
               window.log === self) {
            window.log = _log;
        }

        return self;
    };

    loadPersistedLevel();
    return self;
}));

},{}],6:[function(_dereq_,module,exports){
(function () {
  var now = typeof setImmediate !== 'undefined' ? setImmediate : function(cb) {
    setTimeout(cb, 0)
  }

  /**
   * @constructor
   */
  function promise(fn, er) {
    var self = this

    self.promise = self
    self.state = 'pending'
    self.val = null
    self.fn = fn || null
    self.er = er || null
    self.next = [];
  }

  promise.prototype.resolve = function (v) {
    var self = this
    if (self.state === 'pending') {
      self.val = v
      self.state = 'resolving'

      now(function () {
        self.fire()
      })
    }
  }

  promise.prototype.reject = function (v) {
    var self = this
    if (self.state === 'pending') {
      self.val = v
      self.state = 'rejecting'

      now(function () {
        self.fire()
      })
    }
  }

  promise.prototype.then = function (fn, er) {
    var self = this
    var p = new promise(fn, er)
    self.next.push(p)
    if (self.state === 'resolved') {
      p.resolve(self.val)
    }
    if (self.state === 'rejected') {
      p.reject(self.val)
    }
    return p
  }
  promise.prototype.fail = function (er) {
    return this.then(null, er)
  }
  promise.prototype.finish = function (type) {
    var self = this
    self.state = type

    if (self.state === 'resolved') {
      self.next.map(function (p) {
        p.resolve(self.val)
      })
    }

    if (self.state === 'rejected') {
      self.next.map(function (p) {
        p.reject(self.val)
      })
    }
  }

  // ref : reference to 'then' function
  // cb, ec, cn : successCallback, failureCallback, notThennableCallback
  promise.prototype.thennable = function (ref, cb, ec, cn, val) {
    var self = this
    val = val || self.val
    if (typeof val === 'object' && typeof ref === 'function') {
      try {
        // cnt protects against abuse calls from spec checker
        var cnt = 0
        ref.call(val, function(v) {
          if (cnt++ !== 0) return
          cb(v)
        }, function (v) {
          if (cnt++ !== 0) return
          ec(v)
        })
      } catch (e) {
        ec(e)
      }
    } else {
      cn(val)
    }
  }

  promise.prototype.fire = function () {
    var self = this
    // check if it's a thenable
    var ref;
    try {
      ref = self.val && self.val.then
    } catch (e) {
      self.val = e
      self.state = 'rejecting'
      return self.fire()
    }

    self.thennable(ref, function (v) {
      self.val = v
      self.state = 'resolving'
      self.fire()
    }, function (v) {
      self.val = v
      self.state = 'rejecting'
      self.fire()
    }, function (v) {
      self.val = v

      if (self.state === 'resolving' && typeof self.fn === 'function') {
        try {
          self.val = self.fn.call(undefined, self.val)
        } catch (e) {
          self.val = e
          return self.finish('rejected')
        }
      }

      if (self.state === 'rejecting' && typeof self.er === 'function') {
        try {
          self.val = self.er.call(undefined, self.val)
          self.state = 'resolving'
        } catch (e) {
          self.val = e
          return self.finish('rejected')
        }
      }

      if (self.val === self) {
        self.val = TypeError()
        return self.finish('rejected')
      }

      self.thennable(ref, function (v) {
        self.val = v
        self.finish('resolved')
      }, function (v) {
        self.val = v
        self.finish('rejected')
      }, function (v) {
        self.val = v
        self.state === 'resolving' ? self.finish('resolved') : self.finish('rejected')
      })

    })
  }

  promise.prototype.done = function () {
    if (this.state === 'rejected') {
      throw this.val
    }
    return null
  }

  promise.prototype.nodeify = function (cb) {
    if (typeof cb === 'function') return this.then(function (val) {
        try {
          cb(null, val)
        } catch (e) {
          setImmediate(function () {
            throw e
          })
        }

        return val
      }, function (val) {
        try {
          cb(val)
        } catch (e) {
          setImmediate(function () {
            throw e
          })
        }

        return val
      })

    return this
  }

  promise.prototype.spread = function (fn, er) {
    return this.all().then(function (list) {
      return typeof fn === 'function' && fn.apply(null, list)
    }, er)
  }

  promise.prototype.all = function() {
    var self = this
    return this.then(function(list){
      var p = new promise()
      if(!(list instanceof Array)) {
        p.reject(TypeError)
        return p
      }

      var cnt = 0
      var target = list.length

      function done() {
        if (++cnt === target) p.resolve(list)
      }

      for(var i=0, l=list.length; i<l; i++) {
        var value = list[i]
        var ref;

        try {
          ref = value && value.then
        } catch (e) {
          p.reject(e)
          break
        }

        (function(i){
          self.thennable(ref, function(val){
            list[i] = val
            done()
          }, function(val){
            list[i] = val
            done()
          }, function(){
            done()
          }, value)
        })(i)
      }

      return p
    })
  }

  // self object gets globalalized/exported
  var promiz = {

    // promise factory
    defer: function () {
      return new promise(null, null)
    },

    // calls a function and resolved as a promise
    fcall: function() {
      var def = new promise()
      var args = Array.apply([], arguments)
      var fn = args.shift()
      try {
        var val = fn.apply(null, args)
        def.resolve(val)
      } catch(e) {
        def.reject(e)
      }

      return def
    },

    // calls a node-style function (eg. expects callback as function(err, callback))
    nfcall: function() {
      var def = new promise()
      var args = Array.apply([], arguments)
      var fn = args.shift()
      try {

        // Add our custom promise callback to the end of the arguments
        args.push(function(err, val){
          if(err) {
            return def.reject(err)
          }
          return def.resolve(val)
        })
        fn.apply(null, args)
      } catch (e) {
        def.reject(e)
      }

      return def
    }
  }

  // Export our library object, either for node.js or as a globally scoped variable
  if (typeof module !== 'undefined') {
    module.exports = promiz
  } else {
    self.Promiz = promiz
  }
})()

},{}]},{},[2])
(2)
});