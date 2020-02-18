// setting up the file
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const uuid = require("uuid");
  //const id = uuid().substr(0, 6);
const app = express();
const PORT = 8080;
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

// object database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// user database
const users = { 
  "20j4us": {
    id: "20j4us", 
    email: "felix@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "h3ks3s": {
    id: "h3ks3s", 
    email: "priori@example.com", 
    password: "dishwasher-funk"
  }
}

// renders the 'create new URL page'
app.get("/urls/new", (req, res) => {
  const user = users[req.cookies["id"]];
  let templateVars = {
    user
  }
  res.render("urls_new", templateVars);
});

// renders the 'My URLs' page
app.get('/urls', (req, res) => {
  // sets the database to templateVars variable
  const user = users[req.cookies["id"]];
  let templateVars = { 
    user, 
    urls: urlDatabase 
  };
  // renders the file urls_index with the templateVars
  res.render("urls_index", templateVars);
});

// renders the urls_show page
app.get("/urls/:shortURL", (req, res) => {
  // checks if the shortURL exists
  if (urlDatabase[req.params.shortURL]){
    // sets the database to templateVars variable
    const user = users[req.cookies["id"]];
    let templateVars = {
      user,
      shortURL: req.params.shortURL, 
      longURL: urlDatabase[req.params.shortURL] };
    // renders the urls_show file with templateVars
    res.render("urls_show", templateVars);
  } else {
    // TODO : render an actual page (stretch)
    res.sendStatus(404).send('Not Found');
  }
});

// renders /register page with templateVars
app.get("/register", (req, res) => {
  const user = users[req.cookies["id"]];
  let templateVars = {
    user,
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL] };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const user = users[req.cookies["id"]];
  let templateVars = {
    user,
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL] };
  res.render("login", templateVars);
})

// home page, redirects to /urls for now
app.get("/", (req, res) => {
  res.redirect("/urls/");
});

// redirects the shortUrl to the longUrl (this is where the magic happens)
app.get("/u/:shortURL", (req, res) => {
  // links the shortURL and longURL together
  let linkedUrls = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
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
  if (urlDatabase[req.params.shortURL]){
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
  urlDatabase[shortURL] = req.body.longURL;
  // redirects to a page with new short url
  res.redirect('/urls/' + shortURL);
});

// where the actual editing of the shortURL happens
app.post('/urls/:shortURL/update', (req, res) => {
  // typed modified longURL set to existing shortURL
  urlDatabase[req.params.shortURL] = req.body.editLongUrl;
  // redirect to the shortURL page
  res.redirect('/urls/' + req.params.shortURL);
});

// added cookies to login button, saves as username
app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

// clicking logout will sign out user by clearing cookies.
app.post('/logout', (req, res) => {
  res.clearCookie('username');
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
}

// registers user to db and sends cookie
app.post('/register', (req, res) => {
  // checking if fields have been populated correctly
  if (req.body.email && req.body.password) {
    // entered data is set to variable userData
    const userData = req.body;
    // checks if email already exists
    if (checkEmail(userData.email)) {
      // user data is passed to function addNewUser, which adds to db, and returns the id
      // id is then set to to the cookie
      res.cookie('id', addNewUser(userData));
      // lastly, page is redirected to urls
      res.redirect('/urls');
    } else {
      // send status 400 if email already exists
      res.sendStatus(400).send('Bad Request');
    }
  } else {
    // send status 400 if email or password empty
    res.sendStatus(400).send('Bad Request');
  }
});

// server listen
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});