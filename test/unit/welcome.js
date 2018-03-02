var fetchMock = require('fetch-mock');
const chai = require('chai');
const expect = chai.expect;
const state_machine = require('../../src/fulfillment/state_machine');
const stateHandler = state_machine.stateHandler;
const STATES = state_machine.STATES;
const INTENTS = state_machine.INTENTS;

describe('welcome state', function() {
  before(function() {
    fetchMock.mock(
      '*',
      {
        totalResultSize: 10,
        products: [
          {title: 'The Fellowship of the Ring', 
          specsTag: 'J.R.R. Tolkien', 
          offerData: {offers: [{price: '1.00'}]},
          summary: 'Engelstalig'},
        ]
      });
  });

  it('transitions to the buy state with a buy intent', function() {
    return stateHandler(
          STATES.WELCOME_STATE, 
          INTENTS.BUY_INTENT,
          {parameters: {BookTitle: 'The Lord of the Rings'}}
    ).then(res => {
      expect(res.end_state).to.equal(false);
      expect(res.text).to.equal('Found 10 books for The Lord of the Rings. The first one is The Fellowship of the Ring by J.R.R. Tolkien.');
      expect(res.context.state).to.equal(STATES.BUY_STATE);
      expect(res.context.index).to.equal(0);
    });
  });
});