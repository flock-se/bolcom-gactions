'use strict';

const ActionsSdkApp = require('actions-on-google').ActionsSdkApp;

exports.bolcomFunction= (req, res) => {

  console.log(req.body);

  const app = new ActionsSdkApp({request: req, response: res});

  // Create functions to handle requests here
  function mainIntent (app) {
    let inputPrompt = app.buildInputPrompt(false,
        'Welcome to the Bol.com app. Would you like to order something?');
    app.ask(inputPrompt);
  }

  function buyIntent(app) {
    let argument = app.getArgument();
    let inputPrompt = app.buildInputPrompt(false,
        `You want to buy ${argument}`);
    app.tell(inputPrompt);
  }


  let actionMap = new Map();
  actionMap.set(app.StandardIntents.MAIN, mainIntent);
  actionMap.set(app.StandardIntents.BUY, buyIntent);

  app.handleRequest(actionMap);
}
