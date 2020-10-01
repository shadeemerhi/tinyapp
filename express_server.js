// Requiring all necessary packages and modules
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const { getUserByEmail } = require('./helpers');

// Middleware
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
app.use(bodyParser.urlencoded({extended: true}));
let myKey = process.env.myKey;
app.use(cookieSession({
  name: 'session',
  keys: [myKey],
}));

// Indicating to Express that we are using the EJS view engine
app.set('view engine', 'ejs');

// Setting up the port for express
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Global database objects
const urlDatabase = {};
const users = {};

app.get('/', (req, res) => {
// If a user is logged in, they are redirected to their url's
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get('/urls', (req, res) => {
  let user = users[req.session.user_id];
  // If a user is not logged in, they are redirected to the homepage
  if (!user) {
    req.session = null;
    res.redirect('/login');
  }
  const userURLS = urlsForUser(req.session.user_id);
  let templateVars = {
    user,
    urls: userURLS
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  let user = users[req.session.user_id];
  if (!user) {
    res.redirect('/login');
  }
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  let user = req.session.user_id;
  // If a user is not logged in, they are redirected to the homepage
  if (!user || !urlDatabase[shortURL]) {
    req.session = null;
    res.redirect('/login');
  }
  // If the current session userID does not match the userID of the creator of the URL
  if (req.session.user_id !== urlDatabase[shortURL].userID) {
    res.status(403).send('You are not authorized to view this URL');
  }
  const templateVars = {
    user: users[req.session.user_id],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  res.render('urls_show', templateVars);
});

app.get('/login', (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render('login', templateVars);
});

app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  let longURL = urlChecker(req.body.longURL);
  urlDatabase[shortURL] = {
    longURL,
    userID: req.session.user_id
  };
  res.redirect(`/urls/${shortURL}`);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  if (req.session.user_id && req.session.user_id === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
  }
  res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => {
  // If a user is not logged, or if is a user is logged in but the URL they're trying to edit is not theirs
  if (!req.session.user_id) {
    res.redirect('/login');
  }
  const shortURL = req.params.shortURL;
  if (req.session.user_id !== urlDatabase[shortURL].userID) {
    res.status(403).send('You are not authorized to make changes to this URL');
  }
  let longURL = urlChecker(req.body.longURL);
  if (req.session.user_id) {
    urlDatabase[shortURL].longURL = longURL;
  }
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const inputPassword = req.body.password;
  let userID = getUserByEmail(email, users);
  if (userID) {
    const hashedPassword = users[userID].password;
    if (bcrypt.compareSync(inputPassword, hashedPassword)) {
      req.session.user_id = userID;
      res.redirect('/urls');
    } else {
      res.status(403).send('Incorrect Password');
      return;
    }
  } else {
    res.status(403).send('An account with that email does not exist');
    return;
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    urls: urlDatabase
  };
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  const userID = generateRandomString();
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);
  if (checkEmptyFields(email, req.body.password)) {
    res.status(400).send('Email or password not entered');
    return;
  }
  if (getUserByEmail(email, users)) {
    res.status(400).send('Existing account with that email');
    return;
  }
  const newUser = {
    id: userID,
    email,
    password
  };
  users[userID] = newUser;
  req.session.user_id = userID;
  res.redirect('/urls');
});

const urlsForUser = function(id) {
  let userURLS = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userURLS[url] = urlDatabase[url];
    }
  }
  return userURLS;
};

const checkEmptyFields = function(email, password) {
  if (!email || !password) {
    return true;
  }
  return false;
};

const urlChecker = function(url) {
  if (!url.includes('http://') && !url.includes('www')) {
    url = `http://www.${url}`;
  } else if (! url.includes('http://') && url.includes('www')) {
    url = `http://${url}`;
  }
  return url;
};

const generateRandomString = function() {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  let count = 0;
  while (count < 6) {
    result += chars[Math.floor(Math.random() * chars.length)];
    count++;
  }
  return result;
};