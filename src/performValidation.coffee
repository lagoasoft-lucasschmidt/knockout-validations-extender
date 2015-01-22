_ = require 'lodash'
ko = require 'knockout'
logger = require 'loglevel'
Promise = require 'promiz'
newPromise = require('./utils').newPromise

defaultValidationObservableOptions =
  stopOnFirstError: false

module.exports = performValidation = (options, callback)->

  validationMethods = options?.validationMethods or {}
  translator = options?.translator or throw new Error("translator should have been set")
  defaultMessage = options?.defaultMessage or "Field is not valid"
  rules = options?.rules or {}
  target = options?.target or throw new Error("target is required")
  observableValue = target()
  children = options?.children or []
  resetValidation = options?.resetValidation
  validateChildren = options?.validateChildren
  parent = options?.parent
  container = options?.container

  if resetValidation then target.resetValidation()

  promises = []
  promises.push performOwnValidations(rules, validationMethods, observableValue, defaultMessage, translator, parent, container)

  if validateChildren
    promises.push performChildrenValidations(children, resetValidation, target)
  else
    promises.push newPromise([])

  newPromise(promises)
  .spread (ownErrors)->
    if callback then callback(ownErrors)
    else return ownErrors
  .fail (error)->
    logger.error error
    callback [defaultMessage]
  .done()

performOwnValidations = (rules, validationMethods, observableValue, defaultMessage, translator, parent, container)->
  observableOptions = _.clone(defaultValidationObservableOptions)
  if _.isObject rules?.options
    observableOptions = _.extend observableOptions, rules.options

  errors = []

  stack = ({rule: rule, ruleOptions: ruleOptions} for rule, ruleOptions of rules).reverse()

  executeNextValidation = ()->
    if !stack?.length then return newPromise()
    entry = stack.pop()
    rule = entry.rule
    ruleOptions = entry.ruleOptions

    promise = createValidationPromise(rule, ruleOptions, validationMethods, observableValue, parent, container)
    if not promise then return executeNextValidation()
    else
      handler = (result)->
        if !result
          msg = ruleOptions?.message or validationMethods[rule]?.defaultMessage or defaultMessage
          errors.push translator(msg, ruleOptions)
        if errors?.length and observableOptions.stopOnFirstError
          return newPromise()
        else return executeNextValidation()
      return promise.then handler, (err)->
        logger.error err
        return handler(false)

  executeNextValidation().then ()->
    return _.filter errors, (error)-> return error?

performChildrenValidations = (children, resetValidation, parent)->
  promises = []
  for childDescriptor in children
    child = childDescriptor.child
    if _.isFunction child?.validate
      promises.push Promise.nfcall child.validate, {reset: resetValidation, validateChildren: false, parent: parent, container: childDescriptor.container}

  if !promises?.length then return newPromise([])
  newPromise(promises)
  .all()


createValidationPromise = (rule, ruleOptions, validationMethods, observableValue, parent, container)->
  ruleOptsOrFn = validationMethods[rule]
  if _.isFunction ruleOptsOrFn
    return Promise.fcall ruleOptsOrFn,
      value: observableValue
      validationOptions: ruleOptions
      parent: parent
      container: container

  else if _.isFunction ruleOptsOrFn?.fn
    async = ruleOptsOrFn.async or false
    if !async
      return Promise.fcall ruleOptsOrFn.fn,
        value: observableValue
        validationOptions: ruleOptions
        parent: parent
        container: container
    else
      return Promise.nfcall ruleOptsOrFn.fn,
        value: observableValue
        validationOptions: ruleOptions
        parent: parent
        container: container
  else
    logger.warn "Validation Method with name #{rule} doesnt exist" if rule isnt "options"
    return undefined

