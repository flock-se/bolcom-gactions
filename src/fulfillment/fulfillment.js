'use strict';

const fetch = require('node-fetch');

const BUY_INTENT = 'DefaultWelcomeIntent.DefaultWelcomeIntent-custom';
const YES_INTENT = 'Buyintent.Buyintent-yes';
const NO_INTENT = 'Buyintent.Buyintent-no';
const STOP_INTENT = 'Buyintent.Buyintent-cancel';

const DialogFlowApp = require('actions-on-google').DialogflowApp;

const base = 'http://api.bol.com/catalog/v4/search';
// book category
const ids = 8299;
const key = process.env.KEY;

exports.bolcomFunction= (req, res) => {

  const app = new DialogFlowApp({request: req, response: res});

  function url(bookTitle) {
    return `${base}?q=${encodeURIComponent(bookTitle)}&ids=${ids}&apikey=${key}&format=json`;
  }

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
        return buyState(app);
        break;
      case YES_INTENT:
        confirmState(app);
        break;
      case NO_INTENT:
        nextState(app);
        break;
      case STOP_INTENT:
        stopState(app);
      default: 
        unknownState(app);
    }
  }

  // STATE HANDLERS

  function buyState(app) {
    console.log('Buy state');

    const context = app.getContext('start');
    console.log('Context:');
    console.log(context);
    
    const bookTitle = context.parameters.BookTitle;
    console.log('bookTitle:');
    console.log(bookTitle);

    return fetch(url(bookTitle))
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          console.log('Fetched data:');
          console.log(data);

          const nrOfResults = data.products.length;
          // TODO: there is more than 1 offer. Always find the bol.com offer (new book).
          // TODO: mechanism to send the result(s) to the user's phone.
          // const book = data.products[0];
          // const title = book.title;
          // const author = book.specsTag;
          // const price = book.offerData.offers[0].price;

          // app.setContext('results', 5, {data, index: 0});
          // app.ask(`Found ${nrOfResults} books. The first one is ${title} by ${author} for ${price} euros. Do you want to order this one?`);

          let index = 0;
          let items = data.products.map((book) => {            
            index++;
            const title = book.title;
            const author = book.specsTag;
            const price = book.offerData.offers[0].price;
            return app.buildOptionItem(index, `${title} by ${author} for ${price} euros`)
                      .setTitle(`Book ${index}`)
          });          
          app.askWithList(`Found ${nrOfResults} books. Which one would you like to buy?`,
            app.buildList('Books').addItems(items));
        })
        .catch((error) => {
          console.log('Error:');
          console.log(error);
          app.tell('Cannot contact Bol dot com, try again later.');
        });
  }

  function confirmState(app) {
    const context = app.getContext('results');
    if (context === null || context === undefined || context === {}) {
      // No book to confirm, redirect to the buy state
      buyState(app);
    } else {
      const data = context.parameters.data;
      let index = context.parameters.index;
      if (index === -1) {
        const book = data.products[0];
        const title = book.title;
        const author = book.specsTag;
        const price = book.offerData.offers[0].price;

        app.setContext('results', 5, {data, index: 0});
        app.ask(`Ok, the first one is ${title} by ${author} for ${price} euros. Do you want to order this one?`);
      } else {
        const bookTitle = data.products[index].title;
        console.log('Confirmed purchase of:');
        console.log(bookTitle);
        app.tell(`Ok, placing order for ${bookTitle}.`);
        // TODO: actually do the order
      }
    }
  }

  function nextState(app) {
    console.log('next state');
    const context = app.getContext('results');
    if (context === null || context === undefined || context === {}) {
      // No products, redirect to the buy state
      buyState(app);
    } else {
      const data = context.parameters.data;
      let index = context.parameters.index + 1;
      if (index === 0) {
        stopState(app);
      } else if (index == data.products.length) {
        app.setContext('results', 5, {data, index: -1});
        app.ask('That was the last one. Do you want to start from the beginning?');
      } else {
        const book = data.products[index];
        const title = book.title;
        const author = book.specsTag;
        const price = book.offerData.offers[0].price;

        app.setContext('results', 5, {data, index});
        app.ask(`The next one is ${title} by ${author} for ${price} euros. Do you want to order this one?`);
      }
    }
  }

  function stopState(app) {
    app.setContext('results', 0, {});
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
