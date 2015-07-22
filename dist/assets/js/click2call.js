var c2c = function () {

  var CallButton = function (opts) {
    this.$btn = $(opts.button);
    this.$status = $(opts.status);
    this.params = opts.params;
    this.init();
  };

  CallButton.prototype = {

    init: function () {

      var self = this;

      this.onActiveCall(false);

      this.$btn.click(function (e) {
        e.preventDefault();
        self.onClick();
      });

      this.$audio = $('<audio id="audio_output" autoPlay="autoplay"/>')
        .appendTo('body');

      SIPml.init(function (e) {
        self.$status.text('Ready');
      }, function (e) {
        self.$status.text('Error');
      });

    },

    start: function (callback) {

      if (this.started) {
        callback();
        return;
      }

      var self = this;

      this.sipStack = new SIPml.Stack({

        realm: this.params.domain,
        impi: this.params.from,
        impu: 'sip:' + this.params.from + '@' + this.params.domain,
        digest: this.params.digest,

        websocket_proxy_url: this.params.sipProxy,
        ice_servers: this.params.stunServers,
        enable_media_stream_cache: true,

        events_listener: {
          events: '*',
          listener: function (e) {
            switch (e.type) {
            case 'started':
              self.started = true;
              callback();
              break;
            case 'stopped':
            case 'stopping':
              self.started = false;
              break;
            case 'failed_to_start':
            case 'failed_to_stop':
              self.onStatusChange('Unexpected Error');
              break;
            case 'm_permission_requested':
              self.onStatusChange('Request access to microphone');
              break;
            case 'm_permission_accepted':
              self.onStatusChange('Microphone access was allowed');
              break;
            case 'm_permission_refused':
              self.onStatusChange('Microphone access is denied');
              break;
            }
          }
        }
      });

      this.sipStack.start();
    },

    register: function(callback) {

      if (this.callSession) {
        return;
      }

      if (this.registered ||
         (this.params.digest === undefined && this.params.password === undefined)){
        callback();
        return;
      }

      var self = this;

      var session = this.sipStack.newSession('register', {
        expires: 200,
        events_listener: {
          events: '*',
          listener: function (e) {
            switch (e.type) {
            case 'connecting':
              self.onStatusChange('Registering');
              break;
            case 'connected':
              self.registered = true;
              self.onStatusChange('Registered');
              callback();
              break;
            case 'disconnected':
            case 'terminated':
              self.registered = false;
              //self.onStatusChange('Not Registered');
              self.onStatusChange(e.description);
              break;
            }
          }
        }
      });

      session.register();

    },

    callto: function () {

      if (this.callSession) {
        return;
      }

      var self = this;

      this.callSession = this.sipStack.newSession('call-audio', {
        from: self.params.from,
        audio_remote: self.$audio[0],
        video_local: null,
        video_remote: null,
        events_listener: {
          events: '*',
          listener: function (e) {
            console.log(e.type);
            switch (e.type) {
            case 'connecting':
              self.onActiveCall(true);
              self.onStatusChange('Connecting...');
              break;
            case 'connected':
              self.onStatusChange('Connected');
              break;
            case 'i_ao_request':
              if (e.getSipResponseCode() === 180 || e.getSipResponseCode() === 183) {
                self.onStatusChange('Ringing...');
              }
              break;
            case 'terminating':
              self.onActiveCall(false);
              self.callSession = null;
              break;
            case 'terminated':
              self.onActiveCall(false);
              self.callSession = null;
              //self.status('Terminated');
              self.onStatusChange(e.description);
              break;
            }
          }
        }
      });

      this.callSession.call(this.params.to);

    },

    onClick: function () {
      var self = this;
      if (this.callSession) {
        this.callSession.hangup();
        return;
      }
      self.start(function () {
        self.register(function () {
          self.callto();
        });
      });
    },

    onActiveCall: function (active) {
      if (active) {
        this.$btn
          .addClass('btn-warn')
          .removeClass('btn-normal')
          .text('Drop Call');
      } else {
        this.$btn
          .addClass('btn-normal')
          .removeClass('btn-warn')
          .text('Call Us');
      }
    },

    onStatusChange: function (text) {
      this.$status.text(text);
    }

  };

  var fn = {};

  fn.create = function (opts) {
    return new CallButton(opts);
  };

  return fn;

}();
