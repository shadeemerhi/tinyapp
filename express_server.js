// Requiring all necessary packages, middlewear, and modules
const express = require('express');
const app = express();
const { getUserByEmail } = require('./helpers');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();
let myKey = process.env.myKey;

// Configuring Express
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: [myKey],
}));

// Indicating to Express that we are using the EJS view engine
app.set('view engine', 'ejs');

// Setting the port for the Express server to listen on
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Global database objects
const urlDatabase = {};
const users = {};

// All routes below
app.get('/', (req, res) => {
// If a user is logged in, they are redirected to their url's
// otherwise they are redirected to the login page
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get('/urls', (req, res) => {
  // Retrieving the user from the user database
  let user = users[req.session.user_id];

  // If a user is not logged in, they are undefined and therefore redirected to login page
  if (!user) {
    // Clearing stored cookies - for the case of if server is restarted (i.e. database objects cleared) but browser still contains cookie
    req.session = null;
    res.redirect('/login');
  }

  // Retrieving the URL's that belong to the user from the urlDatabase object
  const userURLS = urlsForUser(req.session.user_id);

  // An object containing values required for view rendering
  // templateVars serves same purpose in subsequent routes
  let templateVars = {
    user,
    urls: userURLS
  };

  // Rendering the template for respective route
  // res.render() same purpose in subsequent routes
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  // Retrieving the user from the user database
  let user = users[req.session.user_id];

  // Clearing stored cookies - for the case of if server is restarted (i.e. database objects cleared) but browser still contains cookie
  if (!user) {
    req.session = null;
    res.redirect('/login');
  }
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  // Retrieving the shortURL parameter from the route
  const shortURL = req.params.shortURL;

  // Retrieving the user from the database
  let user = users[req.session.user_id];

  // If a user is not logged in, they are redirected to the login page
  if (!user || !urlDatabase[shortURL]) {
    req.session = null;
    res.redirect('/login');
  }
  // If the current session userID does not match the userID of the creator of the URL, they are not authorized to view or edit it
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
    user: users[req.session.user_id]
  };
  res.render('login', templateVars);
});

app.post('/urls', (req, res) => {
  // If not logged in, new URL's cannot be created
  if (!req.session.user_id) {
    res.status(403).send('Please login in or create an account to create a TinyURL');
  }

  // Creating a unique ID for the new shortURL
  const shortURL = generateRandomString();
  
  // Checking and adjusting (if needed) the long URL entered by the user
  let longURL = urlChecker(req.body.longURL);

  // Storing the new shortURL in the urlDatabase
  urlDatabase[shortURL] = {
    longURL,
    userID: req.session.user_id
  };
  res.redirect(`/urls/${shortURL}`);
});

app.get('/u/:shortURL', (req, res) => {
  // Obtaining the long URL from the URL database using the given shortURL and redirecting to long URL
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  // Retrieving the shortURL from the request parameters object
  const shortURL = req.params.shortURL;

  // If a user is logged in and their userID matches the userID of the creator, the shortURL is deleted from the database
  if (req.session.user_id && req.session.user_id === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
  }
  res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => {
  // Retrieving the shortURL from the request parameters
  const shortURL = req.params.shortURL;

  // If a user is not logged in, they are redirected to the login page
  if (!req.session.user_id) {
    res.redirect('/login');
  }
  // If a user is logged in but their userID does not match the ID of the creator, they are not authorized to make edits
  if (req.session.user_id !== urlDatabase[shortURL].userID) {
    res.status(403).send('You are not authorized to make changes to this URL');
  }

  // Checking and adjusting (if needed) the long URL given by the user
  let longURL = urlChecker(req.body.longURL);

  // Updating the database with the new long URL and redirecting to users URL's
  urlDatabase[shortURL].longURL = longURL;
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  // Retrieving the email and password given by the user
  const email = req.body.email;
  const inputPassword = req.body.password;
  
  // Obtaining the user from the user database
  let userID = getUserByEmail(email, users);
  if (userID) {
    // Hashing the users input password and checking if it matches the hashed password stored in the database
    // If the password does match or an account with the provided email is not found, an appropriate message is displayed
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
  // Clearing the session cookies and redirecting to the homepage
  req.session = null;
  res.redirect('/');
});

app.get('/register', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    urls: urlDatabase
  };
  res.render('register', templateVars);
});

app.post('/register', (req, res) => {
  // Creating a new userID and retrieving the email from the request body
  const userID = generateRandomString();
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);

  // Checking if the provided credentials are empty
  if (checkEmptyFields(email, req.body.password)) {
    res.status(400).send('Email or password not entered');
    return;
  }
  // If there is already an account with the provided email, an appropriate message is displayed
  if (getUserByEmail(email, users)) {
    res.status(400).send('Existing account with that email');
    return;
  }

  // Creating the new user object once the inputs have been checked and the password has been hashed
  const newUser = {
    id: userID,
    email,
    password
  };

  // Storing the new user in the user database, setting a cookie with the new userID, and redirecting to the URL's page
  users[userID] = newUser;
  req.session.user_id = userID;
  res.redirect('/urls');
});

// Creates and returns an object containing the URL's that the logged-in user owns
const urlsForUser = function(id) {
  let userURLS = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userURLS[url] = urlDatabase[url];
    }
  }
  return userURLS;
};

// Returns true if the entered email and password are not empty, otherwise returns false
const checkEmptyFields = function(email, password) {
  if (!email || !password) {
    return true;
  }
  return false;
};

// Analyzes the entered long URL provided by the user and corrects it accordingly
const urlChecker = function(url) {
  if (!url.includes('http://') && !url.includes('www')) {
    url = `http://www.${url}`;
  } else if (! url.includes('http://') && url.includes('www')) {
    url = `http://${url}`;
  }
  return url;
};

// Generates and returns a random string used for each userID and short URL
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