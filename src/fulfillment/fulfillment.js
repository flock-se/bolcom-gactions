'use strict';

const BUY_INTENT = 'DefaultWelcomeIntent.DefaultWelcomeIntent-custom';
const YES_INTENT = 'intents.yes'
const NO_INTENT = 'intents.no';

const DialogFlowApp = require('actions-on-google').DialogflowApp;

exports.bolcomFunction= (req, res) => {

  const app = new DialogFlowApp({request: req, response: res});


  // Handles the user request
  function responseHandler(app) {
    console.log('Handling response');
    const intent = app.getIntent();
    console.log(`Received intent: ${intent}`);
    const contexts = app.getContexts();
    console.log('Contexts:');
    console.log(contexts);

    switch(intent) {
      case BUY_INTENT:
        buyState(app);
        break;
      case YES_INTENT:
      case NO_INTENT:
        confirmState(app);
        break;
      default: 
        unknownState(app);
    }
  }

  // STATE HANDLERS

  function buyState(app) {
    console.log('Buy state');

    const context = app.getContext('start');
    console.log("Context");
    console.log(context);
    
    const bookTitle = context.parameters.BookTitle;
    console.log('bookTitle:');
    console.log(bookTitle);
    // TODO: call bol.com api with the book title, get full title name and price and add this
    // to the confirmation question.
    app.setContext('bookTitle', 1, bookTitle);
    app.askForConfirmation(`Are you sure you want to buy ${bookTitle}?`);
  }

  function confirmState(app) {
    const intent = app.getIntent();
    if (intent === YES_INTENT) {
      const bookTitle = app.getContext('bookTitle').parameters;
      console.log('Confirmed purchase of:');
      console.log(bookTitle);
      app.tell(`Ok ${getUserName(app)}, buying ${bookTitle}.`);
      // TODO: actually do the order
    } else if (intent === NO_INTENT) {
      app.tell('Ok, try again when you are ready.')
    } else {
      unknownState(app);
    }
  }

  function confirmOrder(app) {
    // TODO: get the delivery time from bol.com and give it to the user
    app.tell(`Order complete. It will arrive at ${getDeliveryAddress(app)} tomorrow at 9 am.`)
  }

  function unknownState(app) {
    console.log('Unknown state');
    app.tell('Something went wrong');
  }

  // HELPERS

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

  app.handleRequest(responseHandler);
}
