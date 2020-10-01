const { assert } = require('chai');
const { getUserByEmail } = require('../helpers');

const users = {
  'userRandomID': {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur'
  },
  'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  }
};

describe('getUserByEmail', function() {
  it('should return a user with a valid email', function() {
    const user = getUserByEmail('user2@example.com', users);
    const expectedOutput = 'user2RandomID';
    assert.deepEqual(user, expectedOutput);
  });

  it("should return undefined if passed an email that's not in the database", function() {
    const user = getUserByEmail('invalidemail@example.com', users);
    const expectedOutput = undefined;
    assert.equal(user, expectedOutput);
  });
});