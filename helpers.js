// function uses email address to return the user from users db
const getUserByEmail = (email, users) => {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return false;
};

// function which returns false if email already exists
const checkEmail = (email, users) => {
  // loops through users db
  for (const user in users) {
    if (users[user].email === email){
      return false;
    }
  }
  return true;
};

// returns a random alpha-numeric string from list
const pickAlphaNum = () => {
  const alphaNums = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  const randomNum = Math.floor(Math.random() * alphaNums.length);
  return alphaNums[randomNum];
}

// returns a generated alpha-numeric string of length 6
function generateRandomString() {
  let output = '';
  for (let i = 1; i <= 6; i++) {
    output += pickAlphaNum();
  }
  return output;
}


// returns only the urls object for the specified userID
const urlsByUser = (database, userID) => {
  const urlsByUser = {};
  for (const url in database) {
    if (database[url].userID === userID) {
      urlsByUser[url] = database[url];
    }
  }
  return urlsByUser;
};

// helper function, adds new user to db, returns id
const addNewUser = (userData, users) => {
  // random string of length 6 is set to id
  const id = generateRandomString();
  // newUser is declared as an object with id, email, password
  const newUser = {
    id,
    email: userData.email,
    password: userData.password
  };
  // this newUser is added to our db of users
  users[id] = newUser
  return users;
};


module.exports = { urlsByUser, generateRandomString, checkEmail, getUserByEmail, addNewUser };