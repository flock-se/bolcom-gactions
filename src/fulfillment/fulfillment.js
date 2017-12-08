'use strict';

const ActionsSdkApp = require('actions-on-google').ActionsSdkApp;

exports.bolcomFunction= (req, res) => {

  console.log("Request body:");
  console.log(req.body);

  const app = new ActionsSdkApp({request: req, response: res});

  // Create functions to handle requests here
  function mainIntent (app) {
    console.log("Main intent")
    let inputPrompt = app.buildInputPrompt(false,
        'Welcome to the Bol dot com app. Would you like to order something?');
    app.ask(inputPrompt);
  }

  function buyIntent(app) {
    console.log("Buy intent");
    let argument = app.getArgument();
    console.log(`argument: ${argument}`);
    let inputPrompt = app.buildInputPrompt(false, `You want to buy ${argument}`);
    app.tell({speech: inputPrompt, displayText: inputPrompt});
  }

  function unknownIntent(app) {
    console.log("Unknown intent");
    app.ask("I'm not sure what you mean, can you repeat?");
  }

  function responseHandler(app) {
    console.log("Handling response");
    // doesn't work:
    // const intent = app.getIntent();
    const intent = req.body.intentName;
    console.log(`Rceived intent: ${intent}`);
    switch (intent) {
      case 'bolcom.intent.main':
      case null:
      case undefined:
        mainIntent(app);
        break;
  
      case 'bolcom.intent.buy':
        buyIntent(app);
        break;
      
      default:
        unknownIntent(app);
    }
  }

  app.handleRequest(responseHandler);
}
