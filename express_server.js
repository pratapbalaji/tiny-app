var express = require("express");
var app = express();
var PORT = process.env.PORT || 3000; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const users = {
  "vinay": {
    id: "vinay",
    email: "vinaybalaji@gmail.com",
    password: "purple-monkey-dinosaur"
  },
 "neha": {
    id: "neha",
    email: "nehachetan@gmail.com",
    password: "dishwasher-funk"
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
  } else if (checkIfEmailExists(userInputEmail)) {
    return false;
  } else {
    return true;
  }
}

function checkIfPasswordMatches (userInputEmail, userInputPassword) {
  for (var user in users) {
    if(users.hasOwnProperty(user)) {
      if ((users[user]["email"] === userInputEmail) && (users[user]["password"] === userInputPassword)) {
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

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/register", (req, res) => {
  res.render("urls_register");
});

app.post("/register", (req, res) => {
  let userInputEmail = req.body.email;
  let userInputPassword = req.body.password;
  if(checkRegisterFormData(userInputEmail, userInputPassword)) {
    do {
      var userId = generateRandomString();
    } while (users[userId]);
    users[userId] = {};
    users[userId]["id"] = userId;
    users[userId]["email"] = userInputEmail;
    users[userId]["password"] = userInputPassword;
    res.cookie("user_id", userId);
    res.redirect("http://localhost:" + PORT + "/");
  } else {
    res.status(400).send("Invalid email / password or email has already been registered.");
  }
});

app.get("/login", (req, res) => {
  res.render("urls_login");
});

app.post("/login", (req,res) => {
  let userEmail = req.body.email;
  let userPassword = req.body.password;
  if (checkIfEmailExists(userEmail) && checkIfPasswordMatches(userEmail, userPassword)) {
    res.cookie("user_id", returnUserID(userEmail));
    res.redirect("http://localhost:" + PORT + "/");
  } else {
    res.status(403).send("Invalid email or password.");
  }

});

app.post("/logout", (req, res) => {
  let userId = req.cookies["user_id"];
  res.clearCookie("user_id", userId);
  res.redirect("http://localhost:" + PORT + "/");
});

app.get("/urls", (req, res) => {
  let userId = req.cookies["user_id"];
  let templateVars = {
    user: users[userId],
    urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  do {
    var shortURL = generateRandomString();
  } while (urlDatabase[shortURL]);
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL]["url"] = req.body.longURL;
  res.redirect("http://localhost:" + PORT + "/urls/" + shortURL);
});

app.post("/urls/:id/delete", (req, res) => { //added delete functionality when delete post request is received from urls index page
  let userId = req.cookies["user_id"];
  if (userId === undefined) {
    res.redirect("/login");
  } else {
    let shortURL = req.params.id;
    if (urlDatabase[shortURL]["userID"] === userId) {
      delete urlDatabase[shortURL];
      res.redirect("http://localhost:" + PORT + "/urls");
    } else {
      res.status(401).send("You are not authorized to delete this URL.")
    }
  }
});

app.get("/urls/new", (req, res) => {
  let userId = req.cookies["user_id"];
  if (userId === undefined) {
    res.redirect("/login");
  } else {
  let templateVars = {
    user: users[userId]
  };
  res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  let userId = req.cookies["user_id"];
  let templateVars = {
    shortURL: req.params.id,
    urls: urlDatabase,
    user: users[userId]
     };
  if (urlDatabase[templateVars.shortURL]) {
    res.render("urls_show", templateVars);
  } else {
    res.send("This URL does not exist in the database. Try again.")
  }
});

app.post("/urls/:id/update", (req, res) => {
  let userId = req.cookies["user_id"];
  if (userId === undefined) {
    res.redirect("/login");
  } else {
    let shortURL = req.params.id;
    let longURL = req.body.updatedLongURL;
    if (urlDatabase[shortURL]["userID"] === userId) {
      urlDatabase[shortURL]["url"] = longURL;
      res.redirect("http://localhost:" + PORT + "/urls");
    } else {
      res.status(401).send("You are not authorized to update this URL.");
    }
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) { // checks if there is a valid object with the provided short URL
  let longURL = urlDatabase[req.params.shortURL][url];
  res.redirect(longURL); // if yes, user is redirected to the longURL of provided shortURL
  } else {
    res.send("This URL does not exist in the database. Try again."); // if no, send a message back saying that this URL does not exist in the database
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