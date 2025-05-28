//1.Dependencies
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const passport = require("passport");
const moment = require("moment");
const expressSession = require("express-session")({
  secret: "secret",
  resave: false,
  saveUninitialized: false,
});

require("dotenv").config();

//import users model
const Signup = require("./models/Signup"); // Assuming Signup.js is in the models folder

//2. instantiations
const app = express();
const PORT = process.env.PORT || 3009;

//import routes
const produceRoutes = require("./routes/produceRoutes");
const salesRoutes = require("./routes/salesRoutes");
const authRoutes = require("./routes/authRoutes");
const managerRoutes = require("./routes/managerRoutes");
const salesAgentRoutes = require("./routes/salesAgentRoutes");
const directorRoutes = require("./routes/directorRoutes");
const indexRoutes = require("./routes/indexRoutes");
const creditRoutes = require("./routes/creditRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const dashboardDataRoutes = require("./routes/dashboardDataRoutes");

//3. configurations
//setting up how it should connect(connecting to what is in your .env file)
app.locals.moment = moment;
mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
  retryWrites: true,
  w: "majority",
});

//testing the connection
mongoose.connection
  .on("open", () => {
    console.log("Mongoose connection open");
  })
  .on("error", (err) => {
    console.log(`Connection error: ${err.message}`);
  });

//set view engine to pug
app.set("view engine", "pug"); //specify the view engine
app.set("views", path.join(__dirname, "views")); //specifies the views directory

//4.middleware
app.use(express.static(path.join(__dirname, "public"))); //specifies a folder for static files
app.use(express.urlencoded({ extended: true })); //this helps to parse data from the form

// express session configs
app.use(expressSession);
app.use(passport.initialize());
app.use(passport.session());

// // passport configs
passport.use(Signup.createStrategy());
passport.serializeUser(Signup.serializeUser());
passport.deserializeUser(Signup.deserializeUser());

//5. routes
//using imported routes
app.use("/", produceRoutes);
app.use("/", salesRoutes);
app.use("/", authRoutes);
app.use("/", managerRoutes);
app.use("/", salesAgentRoutes);
app.use("/", directorRoutes);
app.use("/", indexRoutes);
app.use("/", creditRoutes);
app.use("/api", dashboardDataRoutes);
app.use("/", dashboardRoutes);

//redirection to unavailable page
app.get("*", (req, res, next) => {
  // if it's a request for a file (like .js, .css, etc), skip this
  if (req.originalUrl.includes(".") && !req.originalUrl.endsWith(".html")) {
    return next();
  }
  res.status(404).send("Oops! Page not found");
});

//6. bootstraping the server
app.listen(PORT, () => console.log(`listening on port ${PORT}`));
