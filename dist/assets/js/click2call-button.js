/* globals define */

(function (factory) {

    if (typeof exports === 'object') {
        factory(require('click2call'), require('jquery'));
    } else if (typeof define === 'function' && define.amd) {
        define(['click2call', 'jquery'], factory);
    } else {
        factory(window.c2c);
    }

}(function (context) {

  var CallButton = function (opts) {
    this.$btn = $(opts.button);
    this.$status = $(opts.status);
    if (!opts.userAgentSettings.output) {
      var $audio = $('<audio id="audio_output" autoPlay="autoplay"/>')
        .appendTo('body');
      opts.userAgentSettings.output = $audio[0];
    }
    this.ua = context.newUserAgent(opts.userAgentSettings);
    this.ua.onChange(this.onChange.bind(this));
    this.ua.onEvent(this.onEvent.bind(this));
    this.init();
  };

  CallButton.prototype = {

    init: function () {
      var self = this;
      this.$btn.click(function (e) {
        e.preventDefault();
        self.onClick();
      });
      this.onChange();
    },

    onClick: function () {

      var ua = this.ua;

      if (ua.connecting) {
        return;
      }

      if (ua.connected) {
        ua.drop();
        return;
      }

      ua.callto();

    },

    onEvent: function (e) {
      console.log('Event: ' + e.type);
    },

    onChange: function () {
      var ua = this.ua;
      if (ua.connected) {
        this.$btn
          .addClass('btn-warn')
          .removeClass('btn-normal')
          .text('Drop Call');
      } else {
        if (ua.connecting) {
          this.$btn
            .addClass('btn-normal')
            .removeClass('btn-warn')
            .text('Calling...');
        } else {
          this.$btn
            .addClass('btn-normal')
            .removeClass('btn-warn')
            .text('Call Us');
        }
      }
      this.$status.text(ua.statusText);
    }

  };

  context.newButton = function (opts) {
    return new CallButton(opts);
  };

}));
