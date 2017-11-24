const bolcomFunction = require('./src/fulfillment/fulfillment.js').bolcomFunction;

const express = require('express');

const port = process.env.PORT || 3000;

const app = express();

app.get('/', bolcomFunction);

app.listen(port, function () {
  console.log(`Example app listening on port ${port}`)
});
