'use strict';

global.fetch = require('node-fetch');
const state_machine = require('./state_machine');
const stateHandler = state_machine.stateHandler;
const DialogFlowApp = require('actions-on-google').DialogflowApp;

const CONTEXT = 'state';
const NO_STATE = state_machine.STATES.NO_STATE;

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
    let context = app.getContext(CONTEXT);
    const state = parseState(app, context);
    if (!contextExists(context))
      context = app.getContext('buyintent-followup');
    console.log('Context:');
    console.log(context);
    console.log('In state:');
    console.log(state);

    return stateHandler(state, intent, context)
        .then(obj => {
          const new_context = obj.context;
          const text = obj.text;
          if (obj.end_state) {
            app.tell(text);
          } else {
            if (new_context === undefined)
              app.setContext(CONTEXT, 10, context.parameters);
            else 
              app.setContext(CONTEXT, 10, new_context);
            app.ask(text);
          }
        });
  }

  function parseState(app, context) {
    if (contextExists(context))
      return context.state;
    else
      return NO_STATE;
  }

  function contextExists(context) {
    return !(context === null || context === undefined || context === {});
  }

  app.handleRequest(responseHandler);
}
