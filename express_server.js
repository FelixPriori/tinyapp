// setting up the file
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session')
const uuid = require("uuid");
  // const id = uuid().substr(0, 6);
const app = express();
const PORT = 8080;
app.use(cookieSession({
  name: 'session',
  keys: ['user_d'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));


app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

// object database
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "20j4us" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "20j4us" },
  "32h4o1": { longURL: "http://www.example.com", userID: "h3ks3s" }
};

const users = { 
  "20j4us": {
    id: "20j4us", 
    email: "felix@example.com", 
    password: bcrypt.hashSync("123", 10)
  },
  "h3ks3s": {
    id: "h3ks3s", 
    email: "priori@example.com", 
    password: bcrypt.hashSync("asd", 10)
  }
}

// renders the 'create new URL page' only if used is logged in
app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    const user = users[req.session.user_id];
    let templateVars = {
      user
    }
    res.render("urls_new", templateVars);
  } else {
    const user = users[req.session.user_id];
    let templateVars = {
      loginError: false,
      newUrlMsg: true,
      user
    };
    res.render('login', templateVars);
  }
});

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

// renders the 'My URLs' page
app.get('/urls', (req, res) => {
  // checks if user is logged in
  if (users[req.session.user_id]){
    const user = users[req.session.user_id];
    const urls = urlsByUser(urlDatabase, user.id);
    let templateVars = { 
      error: false,
      loginMsg: false,
      user, 
      urls 
    };
    // renders only the urls for that userID.
    res.render("urls_index", templateVars);
  } else {
    // if the user is not logged in
    const user = users[req.session.user_id];
    let templateVars = { 
      error: false,
      loginMsg: true,
      user, 
      urls: undefined
    };
    // renders a msg telling user to login instead of urls
    res.render("urls_index", templateVars);
  }
});

// renders the urls_show page
app.get("/urls/:shortURL", (req, res) => {
  // checks if user is logged in, if so, assign user object to const user
  const user = req.session.user_id ? users[req.session.user_id] : undefined;
  // if user is logged in, assigns its id to userID
  const userID = user ? user.id : undefined;
  // urls will only be defined if last two checks passed
  const urls = urlsByUser(urlDatabase, userID);
  if (urls[req.params.shortURL]){
    // sets the database to templateVars variable
    let templateVars = {
      user,
      shortURL: req.params.shortURL, 
      longURL: urlDatabase[req.params.shortURL].longURL,
      error: false
    };
    // renders the urls_show file with templateVars
    res.render("urls_show", templateVars);
  } else {
    let templateVars = {
      error: true,
      user,
      urls 
    };
    res.render('urls_index', templateVars);
  }
});

// renders /register page with templateVars
app.get("/register", (req, res) => {
  const user = users[req.session.user_id];
  let templateVars = {
    emailError: false,
    fillError: false,
    user,
  }
  res.render("register", templateVars);
});

// renders /login page with templateVars
app.get("/login", (req, res) => {
  const user = users[req.session.user_id];
  let templateVars = {
    loginError: false,
    newUrlMsg: false,
    user
  };
  res.render("login", templateVars);
})

// home page, redirects to /urls for now
app.get("/", (req, res) => {
  res.redirect("/urls/");
});

// redirects the shortUrl to the longUrl (this is where the magic happens)
app.get("/u/:shortURL", (req, res) => {
  // links the shortURL and longURL together
  let linkedUrls = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL]['longURL'] 
  };
  // extract the longURL, puts it in its own variable
  const longURL = linkedUrls.longURL;
  // redirects to the longUrl
  res.redirect(longURL);
});

// by pressing the edit button on the /urls page, redirects to the url's page
app.get("/urls/:shortURL/edit", (req, res) => {
  res.redirect('/urls/' + req.params.shortURL);
});

// shows the database as a JSON object in browser
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// by pressing the delete button on the /urls page, deletes the url from database
app.post("/urls/:shortURL/delete", (req, res) => {
  // checks if user is logged in, if so, assign user object to const user
  const user = req.session.user_id ? users[req.session.user_id] : undefined;
  // if user is logged in, assigns its id to userID
  const userID = user ? user.id : undefined;
  // urls will only be defined if last two checks passed
  const urls = urlsByUser(urlDatabase, userID);
  if (urls[req.params.shortURL]) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect('/urls');
});

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

// new shortURL creation
app.post("/urls", (req, res) => {
  //creates new short URL with a randomly generated string
  const shortURL = generateRandomString();
  // adds the long url submited to the object as value with the short url as key.
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  // redirects to a page with new short url
  res.redirect('/urls/' + shortURL);
});

// where the actual editing of the shortURL happens
app.post('/urls/:shortURL/update', (req, res) => {
  // checks if user is logged in, if so, assign user object to const user
  const user = req.session.user_id ? users[req.session.user_id] : undefined;
  // if user is logged in, assigns its id to userID
  const userID = user ? user.id : undefined;
  // urls will only be defined if last two checks passed
  const urls = urlsByUser(urlDatabase, userID);
  if (urls[req.params.shortURL]) {
    // typed modified longURL set to existing shortURL
    urlDatabase[req.params.shortURL]['longURL'] = req.body.editLongUrl;
    // redirect to the shortURL page
  }
  res.redirect('/urls/' + req.params.shortURL);
});

// function uses email address to return the user from users db
const getUserByEmail = (email, users) => {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return false;
};

// login with user email & password
app.post('/login', (req, res) => {
  // fetch user with email
  const email = req.body.email;
  const user = getUserByEmail(email, users);
  if (user) {
    // if user exists, check user password
    if (bcrypt.compareSync(req.body.password, user.password)) {
      // if password is good, assign cookie with user.id
      req.session.user_id = user.id;
      res.redirect('/urls');
    } else {
      const user = users[req.session.user_id];
      let templateVars = {
        loginError: true,
        newUrlMsg: false,
        user
      };
      res.render("login", templateVars);
    }
  } else {
    const user = users[req.session.user_id];
    let templateVars = {
      loginError: true,
      newUrlMsg: false,
      user
    };
    res.render("login", templateVars);
  }
});

// clicking logout will sign out user by clearing cookies.
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// helper function, adds new user to db, returns id
const addNewUser = (userData) => {
  // random string of length 6 is set to id
  const id = generateRandomString();
  // newUser is declared as an object with id, email, password
  const newUser = {
    id,
    email: userData.email,
    password: userData.password
  };
  // this newUser is added to our db of users
  users[id] = newUser;
  // id is returned to be used for cookies
  return id;
}

// function which returns false if email already exists
const checkEmail = email => {
  // loops through users db
  for (const user in users) {
    if (users[user].email === email){
      return false;
    }
  }
  return true;
};

// registers user to db and sends cookie
app.post('/register', (req, res) => {
  // checking if fields have been populated correctly
  if (req.body.email && req.body.password) {
    // entered data is set to variable userData
    const userData = {
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10) 
    };
    // checks if email already exists
    if (checkEmail(userData.email)) {
      // user data is passed to function addNewUser, which adds to db, and returns the id
      // id is then set to to the cookie
      req.session.user_id = addNewUser(userData)
      // lastly, page is redirected to urls
      res.redirect('/urls');
    } else {
      // error message if email already exists
      const user = users[req.session.user_id];
      let templateVars = {
        emailError: true,
        fillError: false,
        user
      };
      res.render("register", templateVars);
    }
  } else {
    // error message if user password or email is not entered correctly
    const user = users[req.session.user_id];
    let templateVars = {
      userError: false,
      fillError: true,
      user
    };
    res.render("register", templateVars);
  }
});

// server listen
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});