// require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
const md5 = require('md5');

const app = express();
const port = 3000;

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// used for mongoose-encryption
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function(req, res) {
  const newUser = new User({
    email: req.body.username,
    password: md5(req.body.password)
  }); 

  try {
    // save the new user
    newUser.save();
    res.render("secrets");
  } catch (error) {
    console.log(err);
  }
});

app.post("/login", function(req, res) {
  // console.log(req.body);
  let result = req.body;

  const username = result.usernamelogin;
  const password = md5(result.passwordlogin);

  // find all documents
  User.findOne({email: username}).then((data) => {
    // console.log(data.password == password);
    try {
      if (data.password == password) {
        res.render("secrets");
      } else {
        console.log("Your password was incorrect, try again");
      }
    } catch (error) {
      console.log(error);
    }
  });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });