// setting up the file requirements
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const { urlsByUser, generateRandomString, checkEmail, getUserByEmail } = require('./helpers');
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


// databases --------------------------------|
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
};
// ------------------------------------------|

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


// renders the urls_show page if url belongs to user
// otherwise renders the urls_index page with an error message
app.get("/urls/:shortURL", (req, res) => {
  const user = req.session.userID ? users[req.session.userID] : undefined;
  const userID = user ? user.id : undefined;
  const urls = urlsByUser(urlDatabase, userID);
  if (urls[req.params.shortURL]) {
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
      loginMsg: false,
      user,
      urls
    };
    res.status(400).render('urls_index', templateVars);
  }
});

// renders /register page with templateVars
// if user is already logged in, redirects to the urls page
app.get("/register", (req, res) => {
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
// if user is already logged in, redirects to the urls page
app.get("/login", (req, res) => {
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

// redirects the shortUrl to the longUrl (this is where the magic happens)
app.get("/u/:shortURL", (req, res) => {
  if(urlDatabase[req.params.shortURL]) {
    // links the shortURL and longURL together
    let linkedUrls = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL]['longURL']
    };
    // extract the longURL, puts it in its own variable
    const longURL = linkedUrls.longURL;
    // redirects to the longUrl
    res.redirect(longURL);
  } else {
    if (req.session.userID) {
      const user = users[req.session.userID];
      const urls = urlsByUser(urlDatabase, user.id);
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
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.userID
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
  res.redirect('/urls/' + req.params.shortURL);
});

// Login of user: checks if user exist w/ email, then checks password
// if password is good, user is assigned a cookie and redirected to session
// if any of the steps fail, an error msg is rendered on the login page.
app.post('/login', (req, res) => {
  const email = req.body.email;
  const user = getUserByEmail(email, users);
  if (user) {
    if (bcrypt.compareSync(req.body.password, user.password)) {
      req.session.userID = user.id;
      res.redirect('/urls');
    } else {
      const user = users[req.session.userID];
      let templateVars = {
        loginError: true,
        newUrlMsg: false,
        user
      };
      res.status(400).render("login", templateVars);
    }
  } else {
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

// Registration process: if fields are populated correctly, 
// Password is hashed, user is assigned a new ID, and is added to db.
// if not, or if email exists, user sent back to reg page with error msg.
app.post('/register', (req, res) => {
  if (req.body.email && req.body.password) {
    const userData = {
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    if (checkEmail(userData.email, users)) {
      req.session.userID = addNewUser(userData);
      res.redirect('/urls');
    } else {
      const user = users[req.session.userID];
      let templateVars = {
        emailError: true,
        fillError: false,
        user
      };
      res.status(400).render("register", templateVars);
    }
  } else {
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