const express = require("express");
const app = express();
const PORT = 8080;

const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

const urlDatabase = {};
const users = {};

app.set('view engine', 'ejs');

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get('/urls', (req, res) => {

  // Might need if statement to check if req.cookies['user_id'] is defined?
  const userURLS = urlsForUser(req.cookies['user_id']);
  let templateVars = {
    user: users[req.cookies['user_id']],
    urls: userURLS
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  // console.log(req.cookies);

  // Checking if a user is logged in - a populated cookie would exist
  if (! req.cookies['user_id']) {
    res.redirect('/login');
  }
  const templateVars = {
    user: users[req.cookies['user_id']]
  }
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    user: users[req.cookies['user_id']],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  res.render('urls_show', templateVars);
});

app.get('/login', (req, res) => {
  const templateVars = {
    user: users[req.cookies['user_id']],
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
    userID: req.cookies['user_id']
  }
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  if (req.cookies['user_id']) {
    delete urlDatabase[shortURL];
  };
  res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  let longURL = urlChecker(req.body.longURL);
  urlDatabase[shortURL].longURL = longURL;
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let userID = userByEmail(email);
  // Checks if the user exists
  if (userID) {
    // If the user was found, checking if the provided password is correct
    if (users[userID].password === password) {
      res.cookie('user_id', userID);
      res.redirect('/urls');
    } else { // User with that email was not found
      res.status(403).send('Incorrect Password');
      return;
    }
  } else {
    res.status(403).send('An account with that email does not exist');
    // res.redirect('/register');
    return;
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  let templateVars = {
    user: users[req.cookies['user_id']],
    urls: urlDatabase
  };
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  const userID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  // Checking if registration email or password is empty
  if (checkEmptyFields(email, password)) {
      res.status(400).send('Email or password not entered');
      return;
  }
  // Checking if the email, and therefore user, already exists
  if (userByEmail(email)) {
    res.status(400).send('Existing account with that email');
    return;
  }
  const newUser = {
    id: userID,
    email,
    password
  };
  users[userID] = newUser;
  res.cookie('user_id', userID);
  res.redirect('/urls');
});

function urlsForUser(id) {
  let userURLS = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userURLS[url] = urlDatabase[url];
    }
  }
  return userURLS;
}

function userByEmail(email) {
  for (const user in users) {
    if (users[user].email === email) {
      return user;
    }
  }
  return false;
}

function checkEmptyFields(email, password) {
  if (!email || !password) {
    return true;
  }
  return false;
}

function urlChecker(url) {
  if (!url.includes('http://') && !url.includes('www')) {
    url = `http://www.${url}`;
  } else if (! url.includes('http://') && url.includes('www')) {
    url = `http://${url}`;
  }
  return url;
}

function generateRandomString() {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  let count = 0;
  while (count < 6) {
    result += chars[Math.floor(Math.random() * chars.length)];
    count++;
  }
  return result;
}