/* globals describe, it, expect, c2c */

describe('SIP utils test suite', function () {

  var fs = require('fs');
  var js = fs.readFileSync('./src/scripts/click2call.js','utf-8');
  eval(js); // jshint ignore:line

  var sip = c2c._.sip;

  it('user is required', function () {

    expect(function(){ sip.toUri({}); }).toThrow('User is required');
    expect(function(){ sip.toUri({ domain: 'localhost'}); }).toThrow('User is required');

  });

  it('correct sip uri is created', function () {

    expect(sip.toUri({ user: '1' })).toBe('sip:1@');
    expect(sip.toUri({ user: '2', domain: 'localhost-1'})).toBe('sip:2@localhost-1');
    expect(sip.toUri({ user: '3', domain: 'localhost-2', params: { a: 1, b: true, c: 'value' }})).toBe('sip:3@localhost-2;a=1;b=true;c=value');
    expect(sip.toUri({ user: '4', domain: 'localhost-3', params: {}})).toBe('sip:4@localhost-3');
    expect(sip.toUri({ user: '5', domain: 'localhost-4', params: function(){ return { name: 'value' }; }})).toBe('sip:5@localhost-4;name=value');
    expect(sip.toUri({ user: '6', domain: 'localhost-5', params: function(){ return null; }})).toBe('sip:6@localhost-5');

  });

  it('parameter name and value is escaped', function () {

    expect(sip.toUri({ user: 'user', domain: 'localhost', params: { '#name': '%value%' }})).toBe('sip:user@localhost;%23name=%25value%25');

  });

});
