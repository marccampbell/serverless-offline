'use strict';

const chai = require('chai');
const dirtyChai = require('dirty-chai');
const ServerlessBuilder = require('../support/ServerlessBuilder');
const OffLineBuilder = require('../support/OffLineBuilder');

const expect = chai.expect;
chai.use(dirtyChai);

describe('Offline', () => {
  let offline;

  before(() => {
    // Creates offline test server with no function
    offline = new OffLineBuilder(new ServerlessBuilder()).toObject();
  });

  context('with a non existing route', () => {
    it('should return 404', () => {
      offline.inject({
        method: 'GET',
        url: '/magic',
      }, (res) => {
        expect(res.statusCode).to.eq(404);
      });
    });
  });

  context('with an exiting lambda-proxy integration type route', () => {
    it('should return the expected status code', (done) => {
      const offLine = new OffLineBuilder().addFunctionConfig('fn1', {
        handler: 'handler.hello',
        events: [{
          http: {
            path: 'fn1',
            method: 'GET',
          },
        }],
      }, (event, context, cb) => cb(null, {
        statusCode: 201,
        body: null,
      })).toObject();

      offLine.inject({
        method: 'GET',
        url: '/fn1',
      }, (res) => {
        expect(res.statusCode).to.eq(201);
        done();
      });
    });
  });

  context('with an exiting lambda-proxy integration type route [SHORT MODE]', () => {
    it('should return the expected status code', (done) => {
      const offLine = new OffLineBuilder().addFunctionHTTP('hello', {
        path: 'fn1',
        method: 'GET',
      }, (event, context, cb) => cb(null, {
        statusCode: 201,
        body: null,
      })).toObject();

      offLine.inject({
        method: 'GET',
        url: '/fn1',
      }, (res) => {
        expect(res.statusCode).to.eq(201);
        done();
      });
    });
  });

  context('lambda integration, handling response templates', () => {
    it('should use event defined response template and headers', (done) => {
      const offLine = new OffLineBuilder().addFunctionConfig('index', {
        handler: 'users.index',
        events: [{
          http: {
            path: 'index',
            method: 'GET',
            integration: 'lambda',
            response: {
              headers: {
                'Content-Type': "'text/html'",
              },
              template: "$input.path('$')",
            },
          },
        }],
      }, (event, context, cb) => cb(null, 'Hello World')).toObject();

      offLine.inject('/index', (res) => {
        expect(res.headers['content-type']).to.contains('text/html');
        expect(res.statusCode).to.eq('200');
        done();
      });
    });
  });

  context('[lamda-proxy] Support stageVariables from the stageVariables plugin', () => {
    it('should handle custom stage variables declaration', (done) => {
      const offLine = new OffLineBuilder().addCustom("stageVariables", {hello: 'Hello World'}).addFunctionHTTP('hello', {
        path: 'fn1',
        method: 'GET',
      }, (event, context, cb) => cb(null, {
        statusCode: 201,
        body: event.stageVariables.hello,
      })).toObject();

      offLine.inject({
        method: 'GET',
        url: '/fn1',
      }, (res) => {
        expect(res.payload).to.eq('Hello World');
        done();
      });
    });
  });
});
