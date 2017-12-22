'use strict';

const START_STATE = 'start';
const BUY_STATE = 'buy';
const CONFIRM_STATE = 'confirm';

const ActionsSdkApp = require('actions-on-google').ActionsSdkApp;

exports.bolcomFunction= (req, res) => {

  console.log("Request body:");
  console.log(JSON.stringify(req.body));

  const app = new ActionsSdkApp({request: req, response: res});
  console.log(`Version: ${app.getApiVersion()}`)

  function createState(state, data={}) {
    return JSON.stringify({state, data});
  }

  function parseState(dialogState) {
    console.log("Parse the dialog state");
    console.log(dialogState);

    if (dialogState === undefined || dialogState === null)
      return START_STATE;

    console.log(typeof dialogState);

    let parsedState = dialogState;
    if (typeof dialogState === "string")
      parsedState = JSON.parse(dialogState);

    console.log(parsedState);
    console.log(parsedState.state);

    if (parsedState.state === undefined || parsedState.state === null)
      return START_STATE;
    else
      return parsedState.state;
  }

  function parseData(dialogState) {
    console.log("Parse the dialog state data");
    console.log(dialogState);

    if (dialogState === undefined || dialogState === null)
      return {};

    console.log(typeof dialogState);

    let parsedState = dialogState;
    if (typeof dialogState === "string")
      parsedState = JSON.parse(dialogState);

    console.log(parsedState);
    console.log(parsedState.data);

    if (parsedState.data === undefined || parsedState.data === null)
      return {};
    else
      return parsedState.data;
  }

  function mainIntent (app) {
    console.log('Main intent');
    app.ask('Welcome to the Bol dot com app. Would you like to order something?', createState(BUY_STATE));
  }

  function buyIntent(app) {
    console.log('Buy intent');
    let argument = app.getArgument();
    console.log('argument:');
    console.log(argument);
    app.askForConfirmation(`Are you sure you want to buy ${argument}?`, createState(CONFIRM_STATE, {bookTitle: argument}));
  }

  function confirmIntent(app) {
    let bookTitle = parseData(app.getDialogState()).bookTitle;
    console.log('Confirmed purchase of:');
    console.log(bookTitle);
    app.tell(`Ok ${getUserName(app)}, buying ${bookTitle}`);
    // TODO; actually do the order
    setTimeout(function(){confirmOrder(app)}, 3000);
  }

  function confirmOrder(app) {
    // TODO: get the delivery time from bol.com and give it to the user
    app.tell(`Order complete. It will arrive at ${getDeliveryAddress(app)} tomorrow at 9 am.`)
  }

  function unknownIntent(app) {
    console.log('Unknown intent');
    app.ask("I'm not sure what you mean, can you repeat?");
  }

  function getUserName(app) {
    const userName = app.getUserName();
    if (userName === null)
      return 'Unknown';
    else 
      return userName.displayName;
  }

  function getDeliveryAddress(app) {
    const deliveryAddress = app.getDeliveryAddress();
    if (deliveryAddress === null)
      return 'Unknown address';
    else 
      return deliveryAddress.address;
  }

  function responseHandler(app) {
    console.log('Handling response');
    const intent = app.getIntent();
    console.log(`Received intent: ${intent}`);
    const dialogState = app.getDialogState();
    console.log('Dialog state:');
    console.log(dialogState);
    const state = parseState(dialogState);
    console.log(state);
    switch(state) {
      case START_STATE:
        mainIntent(app);
        break;
      case BUY_STATE:
        buyIntent(app);
        break;
      case CONFIRM_STATE:
        confirmIntent(app);
        break;
      default: 
        unknownIntent(app);
    }
  }

  app.handleRequest(responseHandler);
}
