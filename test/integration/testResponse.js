const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const express = require('express');
const bolcomFunction = require('../../src/fulfillment/fulfillment.js').bolcomFunction;
const bodyParser = require('body-parser');
 
const app = express();

app.use(bodyParser.json({type: 'application/json'}));

app.post('/', bolcomFunction);

function testResponse(payload, expectation) {
    return request(app)
            .post('/')
            .send(payload)
            .expect(200)
            .expect(expectation)
}

module.exports = testResponse;