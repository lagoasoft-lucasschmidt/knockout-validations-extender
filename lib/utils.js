var Promise, collectChildrenErrors, collectChildrenObservableErrors, isObservableArray, iterateChildrenObservable, ko, newPromise, _;

_ = require('lodash');

ko = require('knockout');

Promise = require('promiz');

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
