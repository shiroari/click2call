var c2c = (function () { // jshint ignore:line

  var nop = function () {};

  var sip = {
    toUri: function (opts) {
      var uri, params;
      var name, value;
      if (!opts.user){
        throw 'User is required';
      }
      uri = 'sip:' + opts.user + '@';
      if (opts.domain){
        uri += opts.domain;
      }
      if (opts.params){
        if (typeof opts.params === 'function'){
          params = opts.params();
        } else {
          params = opts.params;
        }
        for (name in params){
          value = params[name] || '';
          if (params.hasOwnProperty(name) && (typeof value !== 'object')) {
            uri += ';' + encodeURIComponent(name) + '=' + encodeURIComponent(value);
          }
        }
      }
      return uri;
    }
  };

  var UserAgent = function (settings) {
    this.eventListeners = [];
    this.updateListeners = [];
    this.settings = settings;
  };

  UserAgent.prototype = {

    init: function (resolve, reject) {

      resolve = resolve || nop;
      reject = reject || nop;

      this.connecting = true;
      this.fireUpdate();

      if (this.inited) {
        resolve();
        return;
      }

      var self = this;

      SIPml.init(function () {
        self.inited = true;
        resolve();
        self.fireUpdate();
      }, function () {
        self.connecting = false;
        reject();
        self.fireUpdate();
      });

    },

    start: function (resolve, reject) {

      resolve = resolve || nop;
      reject = reject || nop;

      if (this.started) {
        resolve();
        return;
      }

      var self = this;

      this.stack = new SIPml.Stack({

        realm: this.settings.domain,
        impi: this.settings.from,
        impu: sip.toUri({
          user: this.settings.from,
          domain: this.settings.domain
        }),
        digest: this.settings.digest,
        password: this.settings.password,

        websocket_proxy_url: this.settings.sipProxy,
        ice_servers: this.settings.stunServers,
        enable_media_stream_cache: true,

        events_listener: {
          events: '*',
          listener: function (e) {
            switch (e.type) {
            case 'started':
              self.started = true;
              resolve();
              self.fireUpdate();
              break;
            case 'stopped':
            case 'stopping':
              self.connecting = false;
              self.started = false;
              self.fireUpdate();
              break;
            case 'failed_to_start':
              self.connecting = false;
              self.statusText = 'Unexpected Error';
              reject();
              self.fireUpdate();
              break;
            case 'm_permission_refused':
              self.statusText = 'Microphone access is denied';
              self.fireUpdate();
              break;
            }
            self.fireEvent(e);
          }
        }
      });

      this.stack.start();
    },

    register: function (resolve, reject) {

      resolve = resolve || nop;
      reject = reject || nop;

      if (this.registered ||
        (this.settings.digest === undefined && this.settings.password === undefined)) {
        resolve();
        return;
      }

      var self = this;

      this.registration = this.stack.newSession('register', {
        expires: 200,
        events_listener: {
          events: '*',
          listener: function (e) {
            switch (e.type) {
            case 'connecting':
              self.statusText = 'Registering';
              self.fireUpdate();
              break;
            case 'connected':
              self.registered = true;
              self.statusText = 'Registered';
              resolve();
              self.fireUpdate();
              break;
            case 'terminated':
              if (!self.registered) {
                reject();
              }
              self.registration = null;
              self.connecting = false;
              self.registered = false;
              self.statusText = e.description;
              self.fireUpdate();
              break;
            }
            self.fireEvent(e);
          }
        }
      });

      this.registration.register();
    },

    callto: function (resolve, reject) {

      if (this.session) {
        return;
      }

      resolve = resolve || nop;
      reject = reject || nop;

      var self = this;

      this.session = this.stack.newSession('call-audio', {
        from: self.settings.from,
        audio_remote: self.settings.output,
        video_local: null,
        video_remote: null,
        events_listener: {
          events: '*',
          listener: function (e) {
            switch (e.type) {
            case 'connecting':
              self.statusText = 'Connecting...';
              self.fireUpdate();
              break;
            case 'connected':
              self.connecting = false;
              self.connected = true;
              self.statusText = 'Connected';
              self.fireUpdate();
              break;
            case 'terminating':
              if (!self.connected) {
                reject();
              }
              self.connecting = false;
              self.connected = false;
              self.session = null;
              self.fireUpdate();
              break;
            case 'terminated':
              self.connecting = false;
              self.connected = false;
              self.session = null;
              self.statusText = e.description;
              self.fireUpdate();
              break;
            case 'i_ao_request':
              if (e.getSipResponseCode() === 180 || e.getSipResponseCode() === 183) {
                self.statusText = 'Ringing...';
                self.fireUpdate();
              }
              break;
            }
            self.fireEvent(e);
          }
        }
      });

      this.session.call(sip.toUri({
        user: this.settings.to,
        domain: this.settings.domain,
        params: this.settings.params
      }));
    },

    drop: function () {

      if (this.session) {
        this.session.hangup();
      }

    },

    fireEvent: function (e) {
      this.eventListeners.forEach(function (l) {
        l(e);
      });
    },

    fireUpdate: function () {
      this.updateListeners.forEach(function (l) {
        l();
      });
    },

    onEvent: function (listener) {
      this.eventListeners.push(listener);
    },

    onChange: function (listener) {
      this.updateListeners.push(listener);
    }

  };

  var CallButton = function (opts) {
    this.$btn = $(opts.button);
    this.$status = $(opts.status);
    if (!opts.userAgentSettings.output) {
      var $audio = $('<audio id="audio_output" autoPlay="autoplay"/>')
        .appendTo('body');
      opts.userAgentSettings.output = $audio[0];
    }
    this.ua = new UserAgent(opts.userAgentSettings);
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

      ua.init(function () {
        ua.start(function () {
          ua.register(function () {
            ua.callto();
          });
        });
      });

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

  var fn = {};

  fn.create = function (opts) {
    return new CallButton(opts);
  };

  fn._ = {
    sip: sip
  };

  return fn;

}());
