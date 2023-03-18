const express = require("express");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const bodyParser = require("body-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const uuid = require("uuid-v4");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({ store: new FileStore(), secret: "secret" }));

var userId = 0;
var contactIds = {}; // key is email of user, value is int for inceremnt ids.

const users = {}; // key-value. key is email, value is object of user.
const tokens = {}; // key-value. key is token, value is email.
const contacts = {}; // key-value. key email, value is contact object, like name and phone.
/**
 * { id: 0, email: "asd@gmail.com", password: "asdasdasd123123" }
 */

app.use(passport.initialize());
app.use(passport.session());



app.get("/login", (req, res) => {
  res.send(
    "This authorization page send a POST request here {email, password}"
  );
});

app.post("/register", (req, res) => {
  const user = req.body;
  if (user.email !== undefined) {
    if (users[user.email] !== undefined) {
      res.status(400).send({message: "User exist with this email"});
      return;
    }
    const registeredUser = {
      email: user.email,
      password: user.password,
      id: userId
    }
    userId++;
    users[user.email] = registeredUser;
    const token = uuid();
    tokens[token] = user.email;

    res.setHeader('Authorization', token).send(registeredUser);
  } else {
    res.status(400).send({message: "Not correct object of User, email and password field is rquired"})
  }
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
      const token = uuid();
      tokens[token] = user.email;
      return res.setHeader('Authorization', token).send({message: "You have successfully authenticated!"});
    });
  })(req, res, next);
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
    },
    (email, password, done) => {
      const user = users[email];

      if (user !== undefined && password === user.password) {
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
  const user1 = user.id !== undefined ? user : false;
  done(null, user1);
});


app.get("/", (req, res) => {
  res.send("This is the main page");
});

app.get("/secret", (req, res) => {
  if (req.isAuthenticated()) {
    res.send("You have been authorized");
  } else {
    res.status(403).send("Access denied");
  }
});

app.get("/contacts", (req, res) => {
  const token = req.headers["authorization"];
  if (token !== undefined) {
    const email = tokens[token];
    if (email !== undefined) {
      res.send(contacts[email]);
    } else {
      res.sendStatus(401);
    }
  } else {
    res.sendStatus(401);
  }
});

app.post("/contacts", (req, res) => {
  const token = req.headers["authorization"];
  if (token !== undefined) {
    const email = tokens[token];
    if (email !== undefined) {
      const contact = req.body;
      if (contact.name !== undefined && contact.phone !== undefined) {
        var counter;
        if (contactIds[email] !== undefined) {
          counter = contactIds[email].counter;
        } else {
          counter = 0;
        }
        contact.id = counter;
        
        var fieldKey = contact.phone;
        if (contacts[email] == undefined) {
          contacts[email] = {};
        }
        contacts[email][fieldKey] = contact;

        console.log('New contact:', contacts[email][fieldKey]);
        
        counter++;
        contactIds[email] = { counter: counter };
      } else {
        //asdasd
      }
      res.send(contact);
    } else {
      res.sendStatus(401);
    }
  } else {
    res.sendStatus(401);
  }
});

app.listen(3000, () => {
  console.log("The server is running on the port 3000");
});
