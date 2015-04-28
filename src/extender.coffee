_ = require 'lodash'
ko = require 'knockout'
utils = require './utils'
performValidation = require './performValidation'

module.exports = (options)->
  live = options?.live or false
  alwaysLive = options?.alwaysLive or false
  getValidationMethods = options.getValidationMethods
  translator = options?.translator

  return (target, rules)->
    hasLiveStarted = false

    rules = rules or {}
    if !ko.isObservable(rules)
      rules = ko.observable(rules)

    # own errors
    ownCalculatedErrors = ko.observableArray()
    ownManualErrors = ko.observableArray()
    ownErrors = ko.computed ()-> ownCalculatedErrors().concat(ownManualErrors())

    # children errors
    children = ko.computed ()->
      array = []
      utils.iterateChildrenObservable target, (child)-> array.push child
      return array

    childrenCalculatedErrors = ko.computed ()-> utils.collectChildrenObservableErrors children(), 'getAllCalculatedErrors'

    childrenManualErrors = ko.computed ()-> utils.collectChildrenObservableErrors children(), 'getAllManualErrors'

    childrenErrors = ko.computed ()-> childrenCalculatedErrors().concat(childrenManualErrors())

    # all errors in this context
    allCalculatedErrors = ko.computed ()-> ownCalculatedErrors().concat(childrenCalculatedErrors())
    allManualErrors = ko.computed ()-> ownManualErrors().concat(childrenManualErrors())
    allErrors = ko.computed ()-> allCalculatedErrors().concat(allManualErrors())

    isValid = ko.computed ()-> allErrors().length is 0

    # status
    target.isValid = isValid
    target.isntValid = ko.computed ()-> !target.isValid()

    # observables ...
    target.getAllErrors = allErrors
    target.getAllCalculatedErrors = allCalculatedErrors
    target.getAllManualErrors = allManualErrors

    target.getOwnErrors = ownErrors
    target.getOwnCalculatedErrors = ownCalculatedErrors
    target.getOwnManualErrors = ownManualErrors
    target.hasOwnErrors = ko.computed ()-> target.getOwnErrors()?.length > 0

    target.getChildrenErrors = childrenErrors
    target.getChildrenCalculatedErrors = childrenCalculatedErrors
    target.getChildrenManualErrors = childrenManualErrors

    target.errors = target.getAllErrors
    target.joinedErrors = (separator)-> ko.computed ()-> target.errors().join(separator)

    # reset

    target.resetValidation = ()->
      ownCalculatedErrors []
      ownManualErrors []
      for childDescriptor in children()
        if _.isFunction(childDescriptor?.child?.validate) then childDescriptor.child.resetValidation()

    # action

    target.validate = (opts, cb)->
      if _.isFunction(opts)
        cb = opts
        opts = {}
      cb = cb or ()->

      performValidation (
        validationMethods: getValidationMethods()
        rules: ko.unwrap(rules)
        target: target
        children: children()
        resetValidation: opts?.reset or false
        validateChildren: opts?.validateChildren or true
        translator: translator
        parent: opts?.parent or null
        container: opts?.container or null
      ), (ownErrors)->
        ownCalculatedErrors _.uniq(ownErrors)
        cb(target.isValid())
        return # added to avoid problems when returning a promise inside callback, crazy chain memory leak

    # utils

    target.hasValidation = (rule)-> ko.computed ()-> rules()[rule]?

    target.removeValidation = (rule)->
      allRules = rules()
      delete allRules[rule]
      rules(allRules)
      return target

    target.validation = (newRule, options)->
      if !newRule then return target
      allRules = rules()
      allRules[newRule] = options or {}
      rules(allRules)
      return target

    if live
      # when rules change, validate if hasnt started yet

      rules.subscribe (newRule)->
        _.defer ()->
          if hasLiveStarted
            target.validate()

      # when target changes, validate

      target.subscribe (newValue)->
        _.defer ()-> target.validate()

      # start live
      if alwaysLive
        _.defer ()->
          hasLiveStarted = true
          target.validate()

    return target
