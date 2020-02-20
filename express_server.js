// setting up the file requirements
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const { urlsByUser, generateRandomString, checkEmail, getUserByEmail, isNewVisitor } = require('./helpers');
const app = express();
const PORT = 8080;

// setting up middlewares
app.use(cookieSession({
  name: 'session',
  keys: ['userID'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

// databases
const urlDatabase = {
  "b2xVn2": { 
    longURL: "http://www.lighthouselabs.ca", 
    userID: "20j4us", 
    date: "2020-2-20",
    visits: 0,
    visitors: []
  },
  "9sm5xK": { 
    longURL: "http://www.google.com", 
    userID: "20j4us", 
    date: "2020-2-20",
    visits: 0,
    visitors: []
  },
  "32h4o1": { 
    longURL: "http://www.example.com", 
    userID: "h3ks3s",
    date: "2020-2-20",
    visits: 0,
    visitors: []
  }
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
};

// renders the 'create new URL page' only if user is logged in
// else it redirects to login with a message
app.get("/urls/new", (req, res) => {
  if (req.session.userID) {
    const user = users[req.session.userID];
    let templateVars = {
      user
    };
    res.render("urls_new", templateVars);
  } else {
    const user = users[req.session.userID];
    let templateVars = {
      loginError: false,
      newUrlMsg: true,
      user
    };
    res.render('login', templateVars);
  }
});

// renders the 'My URLs' page if user is logged in with own url
// if user not logged in, page renders with a prompt to log in.
app.get('/urls', (req, res) => {
  // checks if user is logged in
  if (users[req.session.userID]) {
    const user = users[req.session.userID];
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
    const user = users[req.session.userID];
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




app.get("/urls/:shortURL", (req, res) => {
  const user = req.session.userID ? users[req.session.userID] : undefined;
  const userID = user ? user.id : undefined;
  const urls = urlsByUser(urlDatabase, userID);
  const shortURL = req.params.shortURL;
  if (urls[shortURL]) {
    // renders the urls_show page if url belongs to user
    // sets the database to templateVars variable
    let templateVars = {
      user,
      shortURL,
      longURL: urlDatabase[shortURL].longURL,
      date: urlDatabase[shortURL].date,
      visits: urlDatabase[shortURL].visits,
      visitors: urlDatabase[shortURL].visitors,
      error: false
    };
    // renders the urls_show file with templateVars
    res.render("urls_show", templateVars);
  } else {
    // otherwise renders the urls_index page with an error message
    // if user is logged in, show user urls, else show login message
    // as well as the error message.
    if (user) {
      let templateVars = {
        error: true,
        loginMsg: false,
        user,
        urls
      };
      res.status(400).render('urls_index', templateVars);
    } else {
      let templateVars = {
        error: true,
        loginMsg: true,
        user,
        urls
      };
      res.status(400).render('urls_index', templateVars);
    }
  }
});

// renders /register page with templateVars
app.get("/register", (req, res) => {
  // if user is already logged in, redirects to the urls page
  if (req.session.userID) {
    res.redirect('/urls');
  } else {
    const user = users[req.session.userID];
    let templateVars = {
      emailError: false,
      fillError: false,
      user,
    };
    res.render("register", templateVars);
  }
});

// renders /login page with templateVars
app.get("/login", (req, res) => {
  // if user is already logged in, redirects to the urls page
  if (req.session.userID) {
    res.redirect('/urls');
  } else {
    const user = users[req.session.userID];
    let templateVars = {
      loginError: false,
      newUrlMsg: false,
      user
    };
    res.render("login", templateVars);
  }
});

// Homepage: if user is logged in, redirects to urls page, else redirects to login page.
app.get("/", (req, res) => {
  req.session.userID ? res.redirect("/urls/") : res.redirect("/login/");
});

// logic for shortURL redirection
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session.userID;
  if (urlDatabase[shortURL]) {
    // everytime shortURL is visited, visits count is incremented
    urlDatabase[shortURL]['visits']++;
    const urlVisitors = urlDatabase[shortURL]['visitors'];
    if (isNewVisitor(urlVisitors, userID)) {
      // everytime shortURL is visited by new user, visitor is pushed to visitors array
      if (userID) {
        urlDatabase[shortURL]['visitors'].push(userID);
      } else {
        // if visitor is not a user, 'guest' is pushed to the array.
        urlDatabase[shortURL]['visitors'].push('guest');
      }
    }
    // redirects the shortURL to the longUrl
    let linkedUrls = {
      shortURL: shortURL,
      longURL: urlDatabase[shortURL]['longURL']
    };
    const longURL = linkedUrls.longURL;
    res.redirect(longURL);
  } else {
    // if url doesn't exist
    if (userID) {
      // if user is logged in, show error message only
      const user = users[userID];
      const urls = urlsByUser(urlDatabase, userID);
      let templateVars = {
        error: true,
        loginMsg: false,
        user,
        urls
      };
      res.status(400).render('urls_index', templateVars);
    } else {
      // if user is not logged in, show both messages
      let templateVars = {
        error: true,
        loginMsg: true,
        user: undefined
      };
      res.status(400).render('urls_index', templateVars);
    }
  }
});

// by pressing the edit button on the /urls page, redirects to the url's page
app.get("/urls/:shortURL/edit", (req, res) => {
  res.redirect('/urls/' + req.params.shortURL);
});

// shows the database as a JSON object in browser
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// by pressing the delete button on the /urls page, deletes the url from database (only if user is logged in)
app.post("/urls/:shortURL/delete", (req, res) => {
  const user = req.session.userID ? users[req.session.userID] : undefined;
  const userID = user ? user.id : undefined;
  const urls = urlsByUser(urlDatabase, userID);
  if (urls[req.params.shortURL]) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect('/urls');
});

// new shortURL creation, adds new url to database with associated
// userID, then redirects to the new short url's page.
app.post("/urls", (req, res) => {
  const date = new Date().toLocaleDateString()
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.userID,
    date,
    visits: 0,
    visitors: []
  };
  res.redirect('/urls/' + shortURL);
});

// If user is logged in, the url can be updated in the database
app.post('/urls/:shortURL/update', (req, res) => {
  const user = req.session.userID ? users[req.session.userID] : undefined;
  const userID = user ? user.id : undefined;
  const urls = urlsByUser(urlDatabase, userID);
  if (urls[req.params.shortURL]) {
    urlDatabase[req.params.shortURL]['longURL'] = req.body.editLongUrl;
  }
  res.redirect('/urls');
});

// login logic
app.post('/login', (req, res) => {
  const email = req.body.email;
  const user = getUserByEmail(email, users);
  if (user) {
    // if user exists
    if (bcrypt.compareSync(req.body.password, user.password)) {
      // if password matches, redirects to /urls
      req.session.userID = user.id;
      res.redirect('/urls');
    } else {
      // if password doesn't match, display login error
      const user = users[req.session.userID];
      let templateVars = {
        loginError: true,
        newUrlMsg: false,
        user
      };
      res.status(400).render("login", templateVars);
    }
  } else {
    //if user does not exist, display login error
    const user = users[req.session.userID];
    let templateVars = {
      loginError: true,
      newUrlMsg: false,
      user
    };
    res.status(401).render("login", templateVars);
  }
});

// clicking logout will sign out user by clearing cookies.
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// helper function, adds new user to db, returns id
// this helper function interacts with users database directly
// therefore I did not want to switch it to helpers.js
const addNewUser = (userData) => {
  const id = generateRandomString();
  const newUser = {
    id,
    email: userData.email,
    password: userData.password
  };
  users[id] = newUser;
  return id;
};

// Registration process
app.post('/register', (req, res) => {
  if (req.body.email && req.body.password) {
    // if both email and password are entered correctly
    const userData = {
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    if (checkEmail(userData.email, users)) {
      // if email does not already exist, add new user
      req.session.userID = addNewUser(userData);
      res.redirect('/urls');
    } else {
      // if email exists, send email error
      const user = users[req.session.userID];
      let templateVars = {
        emailError: true,
        fillError: false,
        user
      };
      res.status(400).render("register", templateVars);
    }
  } else {
    // if email or password haven't been entered corectly show fill error
    const user = users[req.session.userID];
    let templateVars = {
      userError: false,
      fillError: true,
      user
    };
    res.status(400).render("register", templateVars);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});