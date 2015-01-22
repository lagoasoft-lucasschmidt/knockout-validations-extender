# knockout validations extender

Adds an extender to a knockout object that allows you to validate its values and obtain the errors.

# Extender

- receives validation description as a parameter, eg:

```

name = ko.observable().extend
  validation: {notEmpty:{message: "Hello world!!"}}

name.validate (isValid)->
  name.getAllErrors() # ["Hello World !!!"]
```



# Install

``npm install knockout-validations-extender --save``

# or include in your Page

``get knockout-validations-extender.min.js from github dist fodler`

You can access global variable **knockoutValidationsExtender** to access the *api*

## Be aware of Dependencies
  - lodash (not bundled)
  - knockout (not bundled)
  - promiz (bundled in)
  - loglevel (bundled in)

# Example

*Html*: (Using knockout-punches for css bindings, better syntax!)
```
<form data-bind="submit: performRegistration">
  <fieldset data-bind="with: registration">
    <div data-bind="with: product">
      <div data-bind="css.has-error: name.isntValid()" class="form-group">
        <input type="text" data-bind="value: name" placeholder="Product Name" class="form-control"/><span data-bind="visible: name.isntValid, text: name.joinedErrors(' / ')" class="help-block"></span>
      </div>
    </div>
    <div data-bind="with: consumer">
      <div data-bind="css.has-error: name.isntValid()" class="form-group">
        <input type="text" data-bind="value: name" placeholder="Consumer Name" class="form-control"/><span data-bind="visible: name.isntValid, text: name.joinedErrors(' / ')" class="help-block"></span>
      </div>
    </div>
    <button type="submit">Submit Registration</button>
  </fieldset>
</form>
```

*Javascript:*
```
var Consumer = (function() {
  function Consumer() {
    this.name = ko.observable().extend({
      validations: {
        required: {
          message: "Please, inform your name!"
        }
      }
    });
  }

  return Consumer;

})();

var Product = (function() {
  function Product() {
    this.name = ko.observable().extend({
      validations: {
        required: {
          message: "Product name is required!!"
        }
      }
    });
  }

  return Product;

})();

var Registration = (function() {
  function Registration() {
    this.product = new Product();
    this.consumer = new Consumer();
  }

  return Registration;

})();


var RegistrationViewModel = (function() {
  function RegistrationViewModel() {
    this.registration = ko.observable(new Registration()).extend({
      validations: {}
    });
    // no validations are need for registration
    // children control their own validations

  }

  RegistrationViewModel.prototype.performRegistration = function() {
    return this.registration.validate(function(isValid) {
      if (!isValid) {
        return alert("hey, please fill all fields");
      }
      alert("everything is good, done");
      this.registration(new Registration());
    });
  };

  return RegistrationViewModel;

})();

var registrationViewModel = new RegistrationViewModel();

ko.applyBindings(registration);

```


*Coffee-script*:
```
class Consumer
  constructor:()->
    @name = ko.observable().extend
      validations:
        required:
          message: "Please, inform your name!"

class Product
  constructor:()->
    @name = ko.observable().extend
      validations:
        required:
          message: "Product name is required!!"

class Registration
  constructor:()->
    @product = new Product()
    @consumer = new Consumer()

class RegistrationViewModel
  constructor:()->
    @registration = ko.observable(new Registration()).extend({validations:{}})
    # no validations are need for registration
    # children control their own validations

  performRegistration:()->
    @registration.validate (isValid)->
      if !isValid then return alert("hey, please fill all fields")
      alert("everything is good, done")
      @registration(new Registration())

registrationViewModel = new RegistrationViewModel()
ko.applyBindings(registration)
```


# Error Concepts

Each knockout object can have:
- calculated errors
  + errors that are calculated based on the given validation descriptions
- manual errors
  + errors added manually to objects
- children errors
  + errors that are resolved based on observables that are contained into the current one.
  + if the current is an observable array, all errors contained in objects inside array will be resolved.
  + algorithm always goes down if the current object is an array/object, and tries to find observables that use ``validations extender``.

All errors are either observable/computable. So they are updated instantly if the object is ``validated`` or is in a ``live`` mode.

All errors are simple ``string``.

You can override the default error message by passing as a validation option in your field.

# Extender Properties/Methods Added to Knockout Object

- observable.getOwnCalculatedErrors() # observable array
- observable.getOwnManualErrors() # observable array
- observable.getOwnErrors() # computed
- observable.hasOwnErrors() # computed

- observable.getChildrenCalculatedErrors() # computed
- observable.getChildrenManualErrors() # computed
- observable.getChildrenErrors() # computed

- observable.getAllCalculatedErrors() # computed
- observable.getAllManualErrors() # computed
- observable.getAllErrors() # computed

- observable.isValid() # computed
  # true if there are any errors into object or children
- observable.isntValid() # computed

- observable.errors() # alias to getAllErrors
- observable.joinedErrors(separator) # returns a computed

- observable.validate(options, callback) **ASYNC**
  + performs the validation to the current object and its ``children``.
  + callback returns boolean determining if its valid or not
  + options available:
    * reset # if true, it will reset all current errors
    * validateChildren # if false, it wont validate children
- observable.resetValidation()

- observable.hasValidation(name)
  + returns computed that returns true if the observable contains that validation
- observable.validation(name, options)
  + adds a new validation to observable
  + if its live, it should trigger a new validation
- observable.removeValidation(name)
  + removes validation

# Extender Modes (Available extenders)

- validation
  + only validates if method ``validate`` is run
- validationLive
  + validates when something changes
- validationAlwaysLive
  + validates since the start of the object lifecycle, and when something changes.

# Validations

## 1 - Synchronous Validations

You must register validations in order for the ``extender`` to use them.

The validations you register are an object that maps a ``validationName`` to a ``validationFunction``.
- ``validationFunction`` returns a boolean, receives a single ``data`` parameter, where ``data`` contains:
  + value (the actual value to validate)
  + validationOptions (the options configured for this observable/validation by you)
  + parent (parent observable that called the validate method)
  + container (object that contains the current observable being evaluated.)
    * Eg: if you had an observableArray, that contains objects, that have a field observable, you could access the parent observableArray and the container object to validate that field. 

```
koValidations = require 'knockout-validations-extender'
# or the global variable knockoutValidationsExtender
koValidation.registerValidationMethods
  required:(data)-> return data.value != null
```

## 2 - Async Validations

Async validations must have ``async`` flag specified when the validation is being registered.

Callback should be called with **boolean** value.

```
koValidation.registerValidationMethods
  required:
    async: true
    fn: (data, callback)->
      callback(data.value != null)

```

## 3 - All available options

a) Can be a simple function
```
koValidation.registerValidationMethods
  required:(data)-> return data.value != null
```
b) Can be an object
```
  required:
    async: true
    fn: (data, callback)->
      callback(data.value != null)
    defaultMessage: "Field should be required!"
```

## 4 - Translate Messages

If you wish to translate the error messages, you can give a function to koValidation.

```
koValidation.setTranslator (message, ruleOptions)->
  return message.replace('{{max}}', ruleOptions.max)
```
