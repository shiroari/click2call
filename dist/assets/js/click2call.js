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
            case 'm_permission_requested':
              break;
            case 'm_permission_accepted':
            case 'm_permission_refused':
              break;
            }
          }
        }
      });

      this.sipStack.start();
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
            switch (e.type) {
            case 'connecting':
              self.onStatusChange('Connecting...');
              self.onActiveCall(true);
              break;
            case 'connected':
              self.onStatusChange('Connected');
              break;
            case 'i_ao_request': {
                var code = e.getSipResponseCode();
                if (code === 180 || code === 183) {
                  self.onStatusChange('Ringing...');
                }
              }
              break;
            case 'terminating':
            case 'terminated': {
                //self.status('Terminated');
                self.onStatusChange(e.description);
                self.onActiveCall(false);
                self.callSession = null;
              }
              break;
            }
          }
        }
      });

      this.callSession.call(this.params.to);

    },

    onClick: function () {
      var self = this;
      if (this.callSession){
        this.callSession.hangup();
        return;
      }
      this.start(function () {
        self.callto();
      });
    },

    onActiveCall: function(active){
      if (active){
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

    onStatusChange: function(text){
      this.$status.text(text);
    }

  };

  var fn = {};

  fn.create = function (opts) {
    return new CallButton(opts);
  };

  return fn;

}();
