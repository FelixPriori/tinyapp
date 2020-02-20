const { assert } = require('chai');
const { urlsByUser, generateRandomString, checkEmail, getUserByEmail,pickAlphaNum } = require('../helpers.js');

const testUsers = {
  "6hj20A": {
    id: "6hj20A", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "ls29dJ1": {
    id: "ls29dJ1", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const testDatabase = {
  "b2xVn2": { longURL: "http://www.canada.ca", userID: "6hj20A" },
  "9sm5xK": { longURL: "http://www.reddit.com", userID: "ls29dJ1" },
  "32h4o1": { longURL: "http://www.example.com", userID: "6hj20A" }
};

describe('getUserByEmail', () => {
  it('should return a user with valid email', () => {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedOutput = {
      id: "6hj20A", 
      email: "user@example.com", 
      password: "purple-monkey-dinosaur" 
    };
    assert.deepEqual(user, expectedOutput);
  });
  it('should return false if user is not in db', () => {
    const user = getUserByEmail('something@impossible.com', testUsers);
    assert.equal(user, false);
  });
});

describe("urlsByUser", () => {
  it('should return an object of urls that are associated with the passed userID', () => {
    const urls = urlsByUser(testDatabase, "6hj20A");
    const expectedOutput = {
      "32h4o1": { longURL: "http://www.example.com", userID: "6hj20A" },
      "b2xVn2": { longURL: "http://www.canada.ca", userID: "6hj20A" },
    };
    assert.deepEqual(urls, expectedOutput);
  });
  it('should return empty object if user does not have any urls', () => {
    const urls = urlsByUser(testDatabase, "I dont exist");
    assert.deepEqual(urls, {});
  });
});

describe("generateRandomString", () => {
  it('should return a random string of length 6', () => {
    const string = generateRandomString();
    assert.equal(string.length, 6);
  });
  it('should return a string', () => {
    const string = generateRandomString();
    assert.equal(typeof(string), 'string');
  })
});

describe("pickAlphaNum", () => {
  it("should return an alpha-numeric character as a string", () => {
    const char = pickAlphaNum();
    assert.equal(typeof(char), 'string');
  });
  it("should only return one character", () => {
    const char = pickAlphaNum();
    assert.equal(char.length, 1);
  });
});

describe("checkEmail", () => {
  it('returns false if email is in the db', () => {
    const email = 'user@example.com';
    assert.equal(checkEmail(email, testUsers), false);
  });
  it('returns true if email is not in the db', () => {
    const email = 'thisemaildoesnot@exist.com'
    assert.equal(checkEmail(email, testUsers), true);
  })
});