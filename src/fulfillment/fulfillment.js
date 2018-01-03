'use strict';

const BUY_INTENT = 'DefaultWelcomeIntent.DefaultWelcomeIntent-custom';
const YES_INTENT = 'Buyintent.Buyintent-yes'
const NO_INTENT = 'Buyintent.Buyintent-no';

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
    console.log("User:");
    console.log(getUserName(app));

    switch(intent) {
      case BUY_INTENT:
        buyState(app);
        break;
      case YES_INTENT:
        confirmState(app);
        break;
      case NO_INTENT:
        rejectState(app);
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
    app.ask(`Are you sure you want to buy ${bookTitle}?`,
      [`Do you want to buy ${bookTitle}?`, 
      `Confirm whether you want to buy ${bookTitle}.`, 
      'Try again when you are ready.']);
  }

  function confirmState(app) {
    const bookTitle = app.getContext('bookTitle').parameters;
    console.log('Confirmed purchase of:');
    console.log(bookTitle);
    app.tell(`Ok, placing order for ${bookTitle}.`);
    // TODO: actually do the order
  }

  function rejectState(app) {
    app.ask('Ok, what book would you like to buy?');
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
