_ = require 'lodash'
ko = require 'knockout'
Promise = require 'promiz'

module.exports.isObservableArray = isObservableArray = (obj)->
  return ko.isObservable(obj) && !(obj.destroyAll == undefined)

module.exports.newPromise = newPromise = (value)->
  deferred = Promise.defer()
  setTimeout ( ()->
    deferred.resolve(value)
  ), 0
  return deferred

module.exports.collectChildrenErrors = collectChildrenErrors = (childrenErrors)->
  errorsToReturn = []

  recursiveCollectChildrenErrors = (childErrors)->
    errorsToReturn = errorsToReturn.concat childErrors.ownErrors
    recursiveCollectChildrenErrors(otherChildErrors) for otherChildErrors in childErrors.childrenErrors

  recursiveCollectChildrenErrors(childErrors) for childErrors in childrenErrors
  return errorsToReturn


module.exports.collectChildrenObservableErrors = collectChildrenObservableErrors = (children, errorsFnName)->
  errors = []
  for childDescriptor in children
    childrenObservable = childDescriptor.child
    if _.isFunction(childrenObservable?[errorsFnName])
      errors = errors.concat childrenObservable[errorsFnName]()
  return errors

module.exports.iterateChildrenObservable = iterateChildrenObservable = (target, iterator)->

  iteratePossibleChildObservable = (possibleObservable)->
    if ko.isObservable(possibleObservable) or isObservableArray(possibleObservable)
      iterator({child: possibleObservable, container: target})
    else if _.isArray(possibleObservable) or _.isObject(possibleObservable)
      iterateChildrenObservable(possibleObservable, iterator)

  observableValue = ko.unwrap(target)

  if _.isArray observableValue
    iteratePossibleChildObservable(possibleObservable) for possibleObservable in observableValue

  else if _.isObject observableValue

    iteratePossibleChildObservable(observableValue[key]) for key in _.keys(observableValue) when observableValue.hasOwnProperty(key)


