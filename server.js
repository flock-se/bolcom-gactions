const bolcomFunction = require('./src/fulfillment/fulfillment.js').bolcomFunction;
const bodyParser = require('body-parser');

const express = require('express');

const port = process.env.PORT || 3000;

const app = express();

app.use(bodyParser.json({type: 'application/json'}));

app.post('/', function(request, response) {
  console.log('headers:' + JSON.stringify(request.headers));
  console.log('body:' + JSON.stringify(request.body));
  
  dialogFlowApp(request, response);

  response.sendStatus(200);
});

app.listen(port, function () {
  console.log(`Example app listening on port ${port}`)
});
