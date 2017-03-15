var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  var charset = "abcdefghijklmnopqrstuvwxyz0123456789";
  do {
    var text = "";
    for( var i=0; i < 6; i++ ) {
      text += charset.charAt(Math.floor(Math.random() * charset.length));
      }
    } while (urlDatabase[text]); // will generate random string until the string does not already exist in the urlDatabase
  return text;
}

app.get("/", (req, res) => {
  res.end("Hello!");
});


app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls/:id/delete", (req, res) => { //added delete functionality when delete post request is received from urls index page
  let shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect("http://localhost:8080/urls");
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls/new", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect("http://localhost:8080/urls/" + shortURL);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    urls: urlDatabase
     };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/update", (req, res) => {
  let shortURL = req.params.id;
  let longURL = req.body.updatedLongURL;
  urlDatabase[shortURL] = longURL;
  console.log(urlDatabase);
  res.redirect("http://localhost:8080/urls");
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) { // checks if there is a valid object with the provided short URL
  let longURL = urlDatabase[req.params.shortURL];
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