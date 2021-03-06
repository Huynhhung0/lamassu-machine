/* globals $, formatE164, libphonenumber */
var TIMEOUT = 120000
var LENGTHS = {
  phoneNumber: 15,
  code: 10
}

var Keypad = function (keypadId, opts, callback) {
  this.keypadId = keypadId
  this.keypad = $('#' + keypadId)
  this.result = ''
  this.count = 0
  this.type = opts.type
  this.opts = opts
  this.callback = callback
  this.timeoutRef = null
  var self = this

  function keyHandler (e) {
    self._restartTimeout()
    var target = $(e.target)
    if (target.hasClass('clear')) {
      return self.reset()
    }

    if (target.hasClass('enter')) {
      self.deactivate()

      const phoneResult = libphonenumber.parsePhoneNumberFromString(self.result, self.opts.country)
      const result = self.type === 'phoneNumber' && phoneResult ? phoneResult.number : self.result

      self.reset()
      return self.callback(result)
    }

    if (target.hasClass('backspace')) {
      return self.backspace()
    }

    if (target.hasClass('plus')) {
      return self._keyPress({ text: function () {
        return '+'
      } })
    }

    if (target.hasClass('key')) {
      return self._keyPress(target)
    }
  }

  this.keypad.get(0).addEventListener('mousedown', keyHandler)
}

Keypad.prototype._restartTimeout = function _restartTimeout () {
  var self = this

  clearTimeout(this.timeoutRef)
  this.timeoutRef = setTimeout(function () {
    self.reset()
    self.callback(null)
  }, TIMEOUT)
}

Keypad.prototype.activate = function activate () {
  this.reset()
  this._restartTimeout()
}

Keypad.prototype.deactivate = function deactivate () {
  clearTimeout(this.timeoutRef)
}

Keypad.prototype.setCountry = function setCountry (country) {
  if (country) this.opts.country = country
}

Keypad.prototype.reset = function reset () {
  this.keypad.find('.box').text('')
  this.count = 0
  this.result = ''
  this.keypad.find('.phone-separator').addClass('hidden')
  this.keypad.find('.enter')[0].disabled = true

  if (this.type === 'phoneNumber') {
    this.keypad.find('.backspace-plus').removeClass('backspace').addClass('plus').html('<img class="plus" src="images/plus.svg" />')
  }
}

Keypad.prototype.backspace = function backspace () {
  this.keypad.find('.box').text('')

  this.result = this.result.substring(0, this.result.length - 1)

  var display = this.type === 'phoneNumber'
    ? (new libphonenumber.AsYouType(this.opts.country).input(this.result))
    : this.result

  if (!display) {
    this.keypad.find('.phone-separator').addClass('hidden')
  }

  this.keypad.find('.box').text(display)

  if (this.type === 'phoneNumber' && !this.result) {
    this.keypad.find('.backspace-plus').removeClass('backspace').addClass('plus').html('<img class="plus" src="images/plus.svg" />')
  }

  if (!this.result) {
    this.keypad.find('.enter')[0].disabled = true
  }
}

Keypad.prototype._keyPress = function _keyPress (target) {
  if (this.result.replace('+', '').length >= LENGTHS[this.type]) return
  var numeral = target.text()
  this.result += numeral
  var display = this.type === 'phoneNumber' && this.result
    ? (new libphonenumber.AsYouType(this.opts.country).input(this.result))
    : this.result

  if (display) {
    this.keypad.find('.phone-separator').removeClass('hidden')
  }

  this.keypad.find('.box').text(display)

  if (this.result.length > 0 && this.type === 'phoneNumber') {
    this.keypad.find('.backspace-plus').addClass('backspace').removeClass('plus').html('<img class="backspace" src="images/delete-keypad.svg" />')
  }

  if (this.result.length > 0 && this.result !== '+') {
    this.keypad.find('.enter')[0].disabled = false
  }
}
