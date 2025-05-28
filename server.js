//1.Dependencies
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const passport = require("passport");
const moment = require("moment");
require("dotenv").config();

// Determine if we're in production
const isProduction = process.env.NODE_ENV === "production";

// Session configuration based on environment
const sessionConfig = {
  secret: process.env.SESSION_SECRET || "dev-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction, // Only use secure cookies in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: isProduction ? "none" : "lax", // Handle cross-site cookies in production
  },
};

// If in production and using a session store (recommended for production)
if (isProduction) {
  const MongoStore = require("connect-mongo");
  sessionConfig.store = MongoStore.create({
    mongoUrl: process.env.DATABASE,
    ttl: 24 * 60 * 60, // 1 day
  });
}

const expressSession = require("express-session")(sessionConfig);

//import users model
const Signup = require("./models/Signup");

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
app.locals.moment = moment;

// MongoDB connection with environment-based configuration
const dbOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ...(isProduction
    ? {
        ssl: true,
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
        retryWrites: true,
        w: "majority",
      }
    : {}),
};

// Function to connect to MongoDB with retry logic
const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.DATABASE, dbOptions);
    console.log(
      `MongoDB connected successfully in ${
        isProduction ? "production" : "development"
      } mode`
    );
  } catch (err) {
    console.error("MongoDB connection error:", err);
    console.log("Retrying connection in 5 seconds...");
    setTimeout(connectWithRetry, 5000);
  }
};

// Initial connection attempt
connectWithRetry();

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error("Application error:", err);
  res.status(500).render("error", {
    message: isProduction
      ? "An error occurred. Please try again later."
      : err.message,
  });
});

//set view engine to pug
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

//4.middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Add JSON parsing middleware

// Trust proxy in production (needed for secure cookies behind a proxy)
if (isProduction) {
  app.set("trust proxy", 1);
}

// express session configs
app.use(expressSession);
app.use(passport.initialize());
app.use(passport.session());

// passport configs
passport.use(Signup.createStrategy());
passport.serializeUser(Signup.serializeUser());
passport.deserializeUser(Signup.deserializeUser());

//5. routes
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
  if (req.originalUrl.includes(".") && !req.originalUrl.endsWith(".html")) {
    return next();
  }
  res.status(404).render("error", {
    message: "Oops! Page not found",
  });
});

//6. bootstraping the server
app.listen(PORT, () => {
  console.log(
    `Server running in ${isProduction ? "production" : "development"} mode`
  );
  console.log(`Listening on port ${PORT}`);
});
