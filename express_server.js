var express = require("express");
var app = express();
var PORT = process.env.PORT || 3000; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  secret: process.env.SESSION_SECRET || "rabbithole",
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }));
app.set("view engine", "ejs");

const users = {
  "vinay": {
    id: "vinay",
    email: "vinaybalaji@gmail.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
 "neha": {
    id: "neha",
    email: "nehachetan@gmail.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
};

const urlDatabase = {
  "b2xVn2": {
    userID: "vinay",
    url: "http://www.lighthouselabs.ca"
  },
  "9sm5xK": {
    userID: "neha",
    url: "http://www.google.com"
  }
};

function generateRandomString() {
  var charset = "abcdefghijklmnopqrstuvwxyz0123456789";
  var text = "";
  for( var i=0; i < 6; i++ ) {
    text += charset.charAt(Math.floor(Math.random() * charset.length));
    }
  return text;
}

function checkIfEmailExists (userInputEmail) {
  for (var user in users) {
    if (users.hasOwnProperty(user)) {
      if (users[user]["email"] === userInputEmail) {
        return true;
      }
    }
  }
  return false;
}

function checkRegisterFormData (userInputEmail, userInputPassword) {
  if (userInputEmail === '' || userInputPassword === '') {
    return false;
  } else {
    return true;
  }
}

function checkIfPasswordMatches (userInputEmail, userInputPassword) {
  for (var user in users) {
    if(users.hasOwnProperty(user)) {
      if ((users[user]["email"] === userInputEmail) && (bcrypt.compareSync(userInputPassword, users[user]["password"]))) {
        return true;
      }
    }
  }
  return false;
}

function returnUserID (userInputEmail) {
  for (var user in users) {
    if (users.hasOwnProperty(user)) {
      if (users[user]["email"] === userInputEmail) {
        return users[user]["id"];
      }
    }
  }
}

function returnURLDatabaseforUser (userId) {
  let urlDatabaseForUser = {};
  for (url in urlDatabase) {
    if (urlDatabase.hasOwnProperty(url)) {
      if(urlDatabase[url]["userID"] === userId) {
        urlDatabaseForUser[url] = {
          "userID": userId,
          "url": urlDatabase[url]["url"]
        }
      }
    }
  }
  return urlDatabaseForUser;
}

app.get("/", (req, res) => {
  let userId = req.session.user_id;
  if (userId === undefined) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

app.get("/register", (req, res) => {
  let userId = req.session.user_id;
  if (userId === undefined) {
    res.status(200).render("urls_register");
  } else {
    res.redirect("http://localhost:" + PORT + "/");
  }
});

app.post("/register", (req, res) => {
  let userInputEmail = req.body.email;
  let userInputPassword = req.body.password;
  if(checkRegisterFormData(userInputEmail, userInputPassword)) {
    if(!checkIfEmailExists(userInputEmail)) {
      do {
        var userId = generateRandomString();
      } while (users[userId]);
      users[userId] = {};
      users[userId]["id"] = userId;
      users[userId]["email"] = userInputEmail;
      users[userId]["password"] = bcrypt.hashSync(userInputPassword, 10);
      req.session.user_id = userId;
      res.redirect("http://localhost:" + PORT + "/");
    } else {
      res.status(400).send("This email is already registered.");
    }
  } else {
    res.status(400).send("Invalid email / password. Try again.");
  }
});

app.get("/login", (req, res) => {
  let userId = req.session.user_id;
  if (userId === undefined) {
    res.status(200).render("urls_login");
  } else {
    res.redirect("http://localhost:" + PORT + "/");
  }
});

app.post("/login", (req,res) => {
  let userEmail = req.body.email;
  let userPassword = req.body.password;
  if (checkIfEmailExists(userEmail) && checkIfPasswordMatches(userEmail, userPassword)) {
    req.session.user_id = returnUserID(userEmail);
    res.redirect("http://localhost:" + PORT + "/");
  } else {
    res.status(401).send("<p>Invalid email or password.</p>");
  }
});

app.post("/logout", (req, res) => {
  delete req.session.user_id;
  res.redirect("http://localhost:" + PORT + "/");
});

app.get("/urls", (req, res) => {
  let userId = req.session.user_id;
  if (userId === undefined) {
    res.status(401).send('<p>You have not logged in.</p><a href="/login">Login Here</a>');
  } else {
  res.status(200);
  let templateVars = {
    user: users[userId],
    urls: returnURLDatabaseforUser(userId) };
  res.render("urls_index", templateVars);
  }
});

app.post("/urls", (req, res) => {
  let userId = req.session.user_id;
  if (userId === undefined) {
    res.status(401).send('<p>You have not logged in.</p><a href="/login">Login Here</a>');
  } else {
    do {
      var shortURL = generateRandomString();
    } while (urlDatabase[shortURL]);
    urlDatabase[shortURL] = {};
    urlDatabase[shortURL]["userID"] = userId;
    urlDatabase[shortURL]["url"] = req.body.longURL;
    res.redirect("http://localhost:" + PORT + "/urls/" + shortURL);
  }
});

app.post("/urls/:id/delete", (req, res) => { //added delete functionality when delete post request is received from urls index page
  let userId = req.session.user_id;
  if (userId === undefined) {
    res.redirect("/login");
  } else {
    let shortURL = req.params.id;
    if (urlDatabase[shortURL]["userID"] === userId) {
      delete urlDatabase[shortURL];
      res.redirect("http://localhost:" + PORT + "/urls");
    } else {
      res.status(401).send("<p>You are not authorized to delete this URL.</p>");
    }
  }
});

app.get("/urls/new", (req, res) => {
  let userId = req.session.user_id;
  if (userId === undefined) {
    res.status(401).send('<p>You have not logged in.</p><a href="/login">Login Here</a>');
  } else {
  let templateVars = {
    user: users[userId],
    urls: returnURLDatabaseforUser(userId)
  };
  res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  if (!urlDatabase[shortURL]) {
      res.status(404).send("<p>This URL does not exist in the database. Try again.</p>")
  } else {
    let userId = req.session.user_id;
    if (userId === undefined) {
      res.status(401).send('<p>You have not logged in.</p><a href="/login">Login Here</a>');
    } else {
      if (urlDatabase[shortURL]["userID"] === userId) {
          let templateVars = {
          shortURL: shortURL,
          urls: returnURLDatabaseforUser(userId),
          user: users[userId]
          };
          res.render("urls_show", templateVars);
      } else {
          res.status(403).send("<p>You are not authorized to edit this URL.</p>");
      }
    }
  }
});

app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  if (!urlDatabase[shortURL]) {
      res.status(404).send("<p>This URL does not exist in the database. Try again.</p>")
  } else {
    let userId = req.session.user_id;
    if (userId === undefined) {
      res.status(401).send('<p>You have not logged in.</p><a href="/login">Login Here</a>');
    } else {
      let longURL = req.body.updatedLongURL;
      if (urlDatabase[shortURL]["userID"] === userId) {
        urlDatabase[shortURL]["url"] = longURL;
        res.redirect("http://localhost:" + PORT + "/urls/" + shortURL);
      } else {
        res.status(403).send("<p>You are not authorized to update this URL.</p>");
      }
    }
  }
});

app.get("/u/:id", (req, res) => {
  if (urlDatabase[req.params.id]) { // checks if there is a valid object with the provided short URL
  let longURL = urlDatabase[req.params.id]["url"];
  res.redirect(longURL); // if yes, user is redirected to the longURL of provided shortURL
  } else {
    res.status(404).send("<p>This URL does not exist in the database. Try again.</p>"); // if no, send a message back saying that this URL does not exist in the database
  }
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});