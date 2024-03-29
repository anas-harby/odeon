const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const passport = require("passport");

const users = require("./routes/api/users");
const movies = require("./routes/api/movies");
const app = express();

// Body Parser middleware
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(bodyParser.json());

// DB Config
const db = require("./config/keys").mongoURI;

// Connect to Mongo
mongoose
  .connect(db, {
    useNewUrlParser: true
  })
  .then(() => console.log("MongoDB Connected..."))
  .catch(err => console.log(err));

// passport middleware
app.use(passport.initialize());

// passport configuration
require("./config/passport")(passport);

// Use Routes
app.use("/api/users", users);
app.use("/api/movies", movies);

// Serve static assets if in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static("client/build"));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

const port = process.env.PORT || 5000;

var server = app.listen(port, () =>
  console.log(`Server started on port ${server.address().port}`)
);
