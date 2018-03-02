'use strict'

const nodemailer = require('nodemailer');

const STATES = {
  NO_STATE: 'NO_STATE',
  WELCOME_STATE: 'WELCOME_STATE',
  BUY_STATE: 'BUY_STATE',
  END_OF_LIST_STATE: 'END_OF_LIST_STATE'
};

const INTENTS = {
  BUY_INTENT: 'DefaultWelcomeIntent.DefaultWelcomeIntent-custom',
  CONFIRM_INTENT: 'Buyintent.Buyintent-yes',
  REJECT_INTENT: 'Buyintent.Buyintent-no',
  STOP_INTENT: 'Buyintent.Buyintent-cancel',
  DETAILS_INTENT: 'BuyIntent.Buyintent-details',
  DESCRIPTION_INTENT: 'Buyintent.Buyintent-description'
}

const base = 'http://api.bol.com/catalog/v4/search';
// book category
const ids = 8299;
const key = process.env.KEY;
const yearRegex = / (\d\d\d\d) /;

// Resolve the intent as transition on the given state
// Return Promise which resolves to an object with:
//  [boolean] end_state: whether and end state has been reached
//  [string] text: what to say to the user
//  [object] context: new context object to persist (empty to keep same context object)
function stateHandler(state, intent, context) {
  const transitions = stateMapper[state];
  const transition = transitions[intent];
  if (transition === undefined)
    return invalidInputTransition(context, intent);
  else
    return transition.call(this, context, intent);
}

// TRANSITION HANDLERS

function welcomeBuyTransition(context, intent) {
  
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
        const book = getBook(data.products[0]);

        return {
          end_state: false,
          text: `Found ${nrOfResults} books for ${bookTitle}. The first one is ${bookToStringSimple(book)}.`,
          context: {data, index: 0, state: STATES.BUY_STATE}
        }
      })
      .catch((error) => {
        console.log('Error:');
        console.log(error);
        return {
          end_state: true,
          text: 'Cannot contact Bol dot com, try again later.'
        }
      });
}

function buyConfirmTransition(context, intent) {
  const data = context.parameters.data;
  let index = context.parameters.index;
  const book = getBook(data.products[index]);
  sendEmail(book);
  return Promise.resolve({
    end_state: true,
    text: `Ok, check your email. I sent you a link to finish purchasing your order. Thanks for using the Bol dot com app!`,
  });
}

function buyNextTransition(context, intent) {
  const data = context.parameters.data;
  let index = context.parameters.index;
  if (index == data.products.length) {
    return endOfList(data);
  } else {
    return nextBookInList(data, index);
  }
}

function buyDetailsTransition(context, intent) {
  const data = context.parameters.data;
  let index = context.parameters.index;
  const book = getBook(data.products[index]);
  return Promise.resolve({
    end_state: false,
    text: bookToStringFull(book)
  });
}

function buyDescriptionTransition(context, intent) {
  const data = context.parameters.data;
  let index = context.parameters.index;
  const book = getBook(data.products[index]);

  return Promise.resolve({
    end_state: false,
    text: book.description
  });
}

function repeatList(data) {
  const book = getBook(data.products[0]);

  return Promise.resolve({
    end_state: false,
    text: `Ok, the first one is ${bookToStringSimple(book)}.`,
    context: {data, index: 0, state: STATES.BUY_STATE}
  });
}

function invalidInputTransition(context, intent) {
  return Promise.resolve({
    end_state: false,
    text: 'Not sure where you are going with that. Can you rephrase your request?'
  });
}

// TRANSITION HELPERS

function endOfList(data) {
  return Promise.resolve({
    end_state: false,
    text: 'That was the last one. Do you want to start from the beginning?',
    context: {data, state: STATES.END_OF_LIST_STATE}
  });
}

function nextBookInList(data, index) {
  index++;
  const book = getBook(data.products[index]);

  return Promise.resolve({
    end_state: false,
    text: `The next one is ${bookToStringSimple(book)}.`,
    context: {data, index, state: STATES.BUY_STATE}
  });
}

// HELPERS

function url(bookTitle) {
  return `${base}?q=${encodeURIComponent(bookTitle)}&ids=${ids}&apikey=${key}&format=json`;
}

function bookToStringFull(book) {
  return `${book.title} by ${book.author}, as ${book.type} in ${book.language} published in ${book.year} for ${book.price} euros.`;
}

function bookToStringSimple(book) {
  return `${book.title} by ${book.author}`;
}

function getBook(product) {
  let id = product.id;
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
    id, title, author, price, type, language, year, description
  }
}

function sendEmail(book) {
  console.log('Sending email for:');
  console.log(book.title);

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: 'mail.flock-se.com',
    port: 25,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PW
    }
  });

  // setup email data with unicode symbols
  let mailOptions = {
      from: '"Bol.com" <bol@flock-se.com>', // sender address
      to: 'willem.veelenturf@gmail.com, bruijnv@gmail.com', // list of receivers
      subject: `Bol.com order for ${book.title}`, // Subject line
      text: `https://www.bol.com/nl/p/-/${book.id}/`, // plain text body
      html: '' // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log(error);
    }
    console.log('Message sent: %s', info.messageId);
    // Preview only available when sending through an Ethereal account
    // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  });

  transporter.close();
}


const welcomeStateTransitions = {
  [INTENTS.BUY_INTENT]: welcomeBuyTransition
};

const buyStateTransitions = {
  [INTENTS.CONFIRM_INTENT]: buyConfirmTransition,
  [INTENTS.REJECT_INTENT]: buyNextTransition,
  [INTENTS.DETAILS_INTENT]: buyDetailsTransition,
  [INTENTS.DESCRIPTION_INTENT]: buyDescriptionTransition
};

const stateMapper = {
  [STATES.WELCOME_STATE]: welcomeStateTransitions,
  [STATES.BUY_STATE]: buyStateTransitions,
  [STATES.NO_STATE]: welcomeStateTransitions
};


module.exports = {stateHandler, STATES, INTENTS};