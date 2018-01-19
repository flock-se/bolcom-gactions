'use strict';

const fetch = require('node-fetch');

const BUY_INTENT = 'DefaultWelcomeIntent.DefaultWelcomeIntent-custom';
const YES_INTENT = 'Buyintent.Buyintent-yes';
const NO_INTENT = 'Buyintent.Buyintent-no';
const STOP_INTENT = 'Buyintent.Buyintent-cancel';
const DETAILS_INTENT = 'BuyIntent.Buyintent-details'
const DESCRIPTION_INTENT = 'Buyintent.Buyintent-description'

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

    // TODO: switch based on state and then on intent
    switch(intent) {
      case BUY_INTENT:
        return buyIntent(app);
      case YES_INTENT:
        confirmIntent(app);
        break;
      case NO_INTENT:
        nextIntent(app);
        break;
      case STOP_INTENT:
        stopIntent(app);
        break;
      case DETAILS_INTENT:
        detailsIntent(app);
        break;
      case DESCRIPTION_INTENT:
        descriptionIntent(app);
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

          const nrOfResults = data.totalResultSize;
          // TODO: there is more than 1 offer. Always find the bol.com offer (new book). Skip the book if it does not have a bol.com offer.
          // TODO: Add intents to ask availability, etc. for the current book.
          // TODO: Add intents for requesting the book type, language, year (do not ask the user, just give him the best option and let him change it)
          // TODO: Add intent for getting the cheapest price
          const book = getBook(data.products[0]);

          app.setContext('results', 5, {data, index: 0});
          app.ask(`Found ${nrOfResults} books for ${bookTitle}. The first one is ${bookToStringSimple(book)}.`);
        })
        .catch((error) => {
          console.log('Error:');
          console.log(error);
          app.tell('Cannot contact Bol dot com, try again later.');
        });
  }

  function confirmIntent(app) {
    const context = app.getContext('results');
    if (!contextExists(context)) {
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
    if (contextExists(context)) {
      console.log('No products, redirect to the buy state');
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

  function detailsIntent(app) {
    const context = app.getContext('results');
    if (!contextExists(context)) {
      // TODO: handle out of context state
      app.ask('What would you like to know more about?');
    } else {
      const data = context.parameters.data;
      let index = context.parameters.index;
      app.setContext('results', 5, context.parameters);
      giveDetailsState(app, getBook(data.products[index]));
    }
  }

  function descriptionIntent(app) {
    const context = app.getContext('results');
    if (!contextExists(context)) {
      // TODO: handle out of context state
      buyIntent(app);
    } else {
      const data = context.parameters.data;
      let index = context.parameters.index;
      app.setContext('results', 5, context.parameters);
      giveDescriptionState(app, getBook(data.products[index]));
    }
  }

  function unknownIntent(app) {
    console.log('Unknown intent');
    app.tell('Something went wrong');
  }

  // STATE HANDLERS

  function repeatListState(app, data) {
    const book = getBook(data.products[0]);
    app.setContext('results', 5, {data, index: 0});
    app.ask(`Ok, the first one is ${bookToStringSimple(book)}. Do you want to order this one?`);
  }

  function confirmBookState(app, book) {
    console.log('Confirmed order of:');
    console.log(book.title);
    app.tell(`Ok, check your email. I sent you a link to finish purchasing your order`);
    // TODO: send mail with link
  }

  function endOfListState(app, data) {
    app.setContext('results', 5, {data, index: -1});
    app.ask('That was the last one. Do you want to start from the beginning?');
  }

  function nextBookInListState(app, data, index) {
    index++;
    const book = getBook(data.products[index]);
    app.setContext('results', 5, {data, index});
    app.ask(`The next one is ${bookToStringSimple(book)}.`);
  }

  function giveDetailsState(app, book) {
    app.ask(bookToStringFull(book));
  }

  function giveDescriptionState(app, book) {
    app.ask(book.description);
  }

  // HELPERS

  function contextExists(context) {
    return !(context === null || context === undefined || context === {});
  }

  function bookToStringFull(book) {
    return `${book.title} by ${book.author}, as ${book.type} in ${book.language} published in ${book.year} for ${book.price} euros.`;
  }

  function bookToStringSimple(book) {
    return `${book.title} by ${book.author}`;
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
    
    let type = 'Unknown type';
    if (summary.includes('Ebook'))
      type = 'Ebook';
    if (summary.includes('Paperback'))
      type = 'Paperback';
    if (summary.includes('Hardcover'))
      type = 'Hardcover'

    let year = 'Unkown year';
    if (yearRegex.test(summary))
      year = summary.match(yearRegex)[1];

    let description = product.shortDescription;

    return {
      title, author, price, type, language, year, description
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
