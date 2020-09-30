const express = require("express");
const app = express();
const PORT = 8080;

const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {};

app.set('view engine', 'ejs');

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get('/urls', (req, res) => {
  let templateVars = {
    user: users[req.cookies['user_id']],
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  const templateVars = {
    user: users[req.cookies['user_id']]
  }
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    user: users[req.cookies['user_id']],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
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
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  let longURL = urlChecker(req.body.longURL);
  urlDatabase[shortURL] = longURL;
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  console.log(req.body);
  res.cookie('user_id', req.body.email);
  res.redirect('/urls');
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
  console.log(email);
  // Checking if registration email or password is empty
  // if (email.length === 0 || password.length === 0) {
  //   res.status(400).send('Email or password not entered');
  // }
  
  if (checkEmptyFields(email, password)) {
      res.status(400).send('Email or password not entered');
  }
  // Checking if the email, and therefore user, already exist
  if (userExists(email)) {
    res.status(400).send('Existing account with that email');
  }
  const newUser = {
    id: userID,
    email,
    password
  };
  users[userID] = newUser;
  console.log(users);
  res.cookie('user_id', userID);
  res.redirect('/urls');
});

function userExists (email) {
  for (const user in users) {
    console.log('USER IN LOOP', user.email);
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
}

function checkEmptyFields (email, password) {
  if (!email || !password) {
    return true;
  }
  return false;
}

function urlChecker (url) {
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