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

const yearRegex = /(\d\d\d\d)/;

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
        return buyIntent(app);
        break;
      case YES_INTENT:
        confirmIntent(app);
        break;
      case NO_INTENT:
        nextIntent(app);
        break;
      case STOP_INTENT:
        stopIntent(app);
        break;
      default: 
        unknownIntent(app);
    }
  }

  // STATE HANDLERS

  function buyIntent(app) {
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
          // TODO: there is more than 1 offer. Always find the bol.com offer (new book). Skip the book if it does not have a bol.com offer.
          // TODO: filter the list more. e.g. lord of the rings gives the similarion. Should check the name better. Or better query?
          // TODO: Add intents to ask description, availability, etc. for the current book.
          const book = getBook(data.products[0]);

          app.setContext('results', 5, {data, index: 0});
          app.ask(`Found ${nrOfResults} books for ${bookTitle}. The first one is ${bookToString(book)}. Do you want to order this one?`);
        })
        .catch((error) => {
          console.log('Error:');
          console.log(error);
          app.tell('Cannot contact Bol dot com, try again later.');
        });
  }

  function confirmIntent(app) {
    const context = app.getContext('results');
    if (context === null || context === undefined || context === {}) {
      // No book to confirm, redirect to the buy state
      buyIntent(app);
    } else {
      const data = context.parameters.data;
      let index = context.parameters.index;
      if (index === -1) {
        repeatListState(app, data);
      } else {
        confirmBookState(app, getBook(data.products[index]));
      }
    }
  }

  function nextIntent(app) {
    const context = app.getContext('results');
    if (context === null || context === undefined || context === {}) {
      // No products, redirect to the buy state
      buyIntent(app);
    } else {
      const data = context.parameters.data;
      let index = context.parameters.index;
      if (index === -1) {
        stopIntent(app);
      } else if (index == data.products.length) {
        endOfListState(app, data);
      } else {
        nextBookInListState(app, data, index);
      }
    }
  }

  function stopIntent(app) {
    app.setContext('results', 0, {});
    app.ask('Ok, what book would you like to buy?');
  }

  function unknownIntent(app) {
    console.log('Unknown intent');
    app.tell('Something went wrong');
  }

  // STATE HANDLERS

  function repeatListState(app, data) {
    const book = getBook(data.products[0]);
    app.setContext('results', 5, {data, index: 0});
    app.ask(`Ok, the first one is ${bookToString(book)}. Do you want to order this one?`);
  }

  function confirmBookState(app, book) {
    console.log('Confirmed purchase of:');
    console.log(book.title);
    // TODO: Translate and give back the order time
    app.tell(`Ok, placing order for ${book.title}.`);
    // TODO: actually do the order
  }

  function endOfListState(app, data) {
    app.setContext('results', 5, {data, index: -1});
    app.ask('That was the last one. Do you want to start from the beginning?');
  }

  function nextBookInListState(app, data, index) {
    index++;
    const book = getBook(data.products[index]);
    app.setContext('results', 5, {data, index});
    app.ask(`The next one is ${bookToString(book)}. Do you want to order this one?`);
  }

  // HELPERS

  function bookToString(book) {
    return `${book.title} by ${book.author}, as ${book.type} in ${book.language} published in ${book.year} for ${book.price} euros`;
  }

  function getBook(product) {
    let title = product.title;
    let author = product.specsTag;
    let price = product.offerData.offers[0].price;

    let summary = product.summary;
    let language = 'Unknown language';
    if (summary.includes('Nederlandstalig'))
      language = 'Dutch';
    if (summary.includes('Engelstalig'))
      language = 'English';
    if (summary.includes('Spaanstalig'))
      language = 'Spanish';
    
    type = 'Unknown type';
    if (summary.includes('Ebook'))
      type = 'Ebook';
    if (summary.includes('Paperback'))
      type = 'Paperback';
    if (summary.includes('Hardcover'))
      type = 'Hardcover'

    year = 'Unkown year';
    if (summary.test(yearRegex))
      year = summary.match(yearRegex)[1];

    return {
      title, author, price, type, language, year
    }
  }

  function getUserName(app) {
    const userName = app.getUserName();
    if (userName === null)
      return 'Unknown';
    else 
      return userName.displayName;
  }

  app.handleRequest(responseHandler);
}
