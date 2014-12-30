ko = require 'knockout'
_ = require 'lodash'
extender = require './extender'

# private fields

validationMethods = {}

defaultMessage = "Field is not valid"

translatorFn = (m)-> m

# external API

module.exports.registerValidationMethods = (otherValidationMethods)->
  validationMethods = _.extend validationMethods, otherValidationMethods
  return module.exports

module.exports.setDefaultMessage = (msg)->
  defaultMessage = msg
  return module.exports

module.exports.setTranslator = (fn)-> translatorFn = fn

# register extenders

basicOptions =
  getValidationMethods: ()-> return validationMethods
  live: false
  translator: (m, validationOptions)-> translatorFn(m, validationOptions)

ko.extenders.validations = extender basicOptions

ko.extenders.validationsLive = extender _.extend(_.clone(basicOptions), {live:true})

ko.extenders.validationsAlwaysLive = extender _.extend(_.clone(basicOptions), {live:true, alwaysLive: true})
