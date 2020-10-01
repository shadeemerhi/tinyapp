const express = require("express");
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const PORT = 8080;

const bodyParser = require("body-parser");
// const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
app.use(bodyParser.urlencoded({extended: true}));
// app.use(cookieParser());
let myKey = process.env.myKey;

app.use(cookieSession({
  name: 'session',
  keys: [myKey],
}));

const urlDatabase = {};
const users = {};

app.set('view engine', 'ejs');

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get('/urls', (req, res) => {
  // was in below urlsForUser --> req.cookies['user_id']
  const userURLS = urlsForUser(req.session.user_id);
  let templateVars = {
    // user: users[req.cookies['user_id']],
    user: users[req.session.user_id],
    urls: userURLS
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  //  was in if --> ! req.cookies['user_id']
  if (!req.session.user_id) {
    res.redirect('/login');
  }
  const templateVars = {
    // user: users[req.cookies['user_id']]
    user: users[req.session.user_id]
  }
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    // user: users[req.cookies['user_id']],
    user: users[req.session.user_id],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  res.render('urls_show', templateVars);
});

app.get('/login', (req, res) => {
  const templateVars = {
    // user: users[req.cookies['user_id']],
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
    // userID: req.cookies['user_id']
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
  // was in if --> req.cookies['user_id']
  if (req.session.user_id) {
    delete urlDatabase[shortURL];
  };
  res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  let longURL = urlChecker(req.body.longURL);
  // was in if --> req.cookies['user_id']
  if (req.session.user_id) {
    urlDatabase[shortURL].longURL = longURL;
  };
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const inputPassword = req.body.password;
  let userID = userByEmail(email);
  if (userID) {
    const hashedPassword = users[userID].password;
    if (bcrypt.compareSync(inputPassword, hashedPassword)) {
      // res.cookie('user_id', userID);
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
  // res.clearCookie('user_id');
  req.session = null;
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  let templateVars = {
    // user: users[req.cookies['user_id']],
    user: users[req.session.user_id],
    urls: urlDatabase
  };
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  const userID = generateRandomString();
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);
  if (checkEmptyFields(email, password)) {
      res.status(400).send('Email or password not entered');
      return;
  }
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
  // res.cookie('user_id', userID);
  req.session.user_id = userID;
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