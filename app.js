const express = require("express");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const bodyParser = require("body-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({ store: new FileStore(), secret: "secret" }));

const user = {
  id: 1,
  email: "nikolas@gmail.com",
  password: "password",
};

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
    },
    (email, password, done) => {
      if (email === user.email && password === user.password) {
        console.log("User return: " + JSON.stringify(user));
        return done(null, user);
      } else {
        return done(null, false);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serialize: " + JSON.stringify(user));
  done(null, user.id);
});

passport.deserializeUser((user, done) => {
  console.log("Deserialize: " + id);
  const user1 = user.id === id ? user : false;
  done(null, user1);
});

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.send("This is the main page");
});

app.get("/login", (req, res) => {
  res.send(
    "This authorization page send a POST request here {email, password}"
  );
});

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.send("enter the correct email and password");
    }
    req.login(user, (err) => {
      return res.send("You have successfully authenticated!");
    });
  })(req, res, next);
});

app.get("/secret", (req, res) => {
  if (req.isAuthenticated()) {
    res.send("You have been authorized");
  } else {
    res.status(403).send("Access denied");
  }
});

app.listen(3000, () => {
  console.log("The server is running on the port 3000");
});
