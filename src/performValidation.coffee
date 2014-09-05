_ = require 'lodash'
ko = require 'knockout'
logger = require 'loglevel'
Promise = require 'promiz'
newPromise = require('./utils').newPromise

defaultValidationObservableOptions =
  stopOnFirstError: false

module.exports = performValidation = (options, callback)->

  validationMethods = options?.validationMethods or {}
  defaultMessage = options?.defaultMessage or "Field is not valid"
  rules = options?.rules or {}
  target = options?.target or throw new Error("target is required")
  observableValue = target()
  children = options?.children or []
  resetValidation = options?.resetValidation
  validateChildren = options?.validateChildren

  if resetValidation then target.resetValidation()

  promises = []
  promises.push performOwnValidations(rules, validationMethods, observableValue, defaultMessage)

  if validateChildren
    promises.push performChildrenValidations(children, resetValidation)
  else
    promises.push newPromise([])

  newPromise(promises)
  .spread (ownErrors)->
    if callback then callback(ownErrors)
    else return ownErrors
  .fail (error)=>
    logger.error error
    callback [defaultMessage]
  .done()

performOwnValidations = (rules, validationMethods, observableValue, defaultMessage)->
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

    promise = createValidationPromise(rule, ruleOptions, validationMethods, observableValue)
    if not promise then return executeNextValidation()
    else
      return promise.then (result)->
        if !result
          errors.push ruleOptions?.message or validationMethods[rule]?.defaultMessage or defaultMessage
        if errors?.length and observableOptions.stopOnFirstError
          return newPromise()
        else return executeNextValidation()

  executeNextValidation().then ()->
    return _.filter errors, (error)-> return error?

performChildrenValidations = (children, resetValidation)->
  promises = []
  for child in children
    if _.isFunction child?.validate
      promises.push Promise.nfcall child.validate, {reset: resetValidation, validateChildren: false}

  if !promises?.length then return newPromise([])
  newPromise(promises)
  .all()


createValidationPromise = (rule, ruleOptions, validationMethods, observableValue)->
  ruleOptsOrFn = validationMethods[rule]
  if _.isFunction ruleOptsOrFn
    return Promise.fcall ruleOptsOrFn,
      value: observableValue
      validationOptions: ruleOptions

  else if _.isFunction ruleOptsOrFn?.fn
    async = ruleOptsOrFn.async or false
    if !async
      return Promise.fcall ruleOptsOrFn,
        value: observableValue
        validationOptions: ruleOptions
    else
      return Promise.nfcall ruleOptsOrFn,
        value: observableValue
        validationOptions: ruleOptions
  else
    logger.warn "Validation Method with name #{rule} doesnt exist" if rule isnt "options"
    return undefined

