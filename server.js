//1.Dependencies
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const passport = require("passport");
const moment = require("moment");
const MongoStore = require("connect-mongo");
require("dotenv").config();

// Determine if we're in production
const isProduction = process.env.NODE_ENV === "production";

// Log environment variables (excluding sensitive data)
console.log("Environment:", {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_CONNECTED: !!process.env.DATABASE,
  SESSION_SECRET_SET: !!process.env.SESSION_SECRET,
  USING_MONGO_STORE: isProduction,
  PORT: process.env.PORT,
});

// Create MongoDB store instance
const mongoStore = MongoStore.create({
  mongoUrl: process.env.DATABASE,
  ttl: 24 * 60 * 60, // 1 day
  touchAfter: 24 * 3600, // 24 hours
  autoRemove: "native",
  crypto: {
    secret: process.env.SESSION_SECRET,
  },
});

// Add logging for session events
mongoStore.on("create", (sessionId) => {
  console.log("Session created:", sessionId);
});

mongoStore.on("destroy", (sessionId) => {
  console.log("Session destroyed:", sessionId);
});

mongoStore.on("error", (error) => {
  console.error("Session store error:", error);
});

// Session configuration based on environment
const sessionConfig = {
  secret: process.env.SESSION_SECRET || "kgl_secure_session_2024_verah_2468",
  resave: true,
  saveUninitialized: true,
  store: isProduction ? mongoStore : undefined,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: isProduction ? "none" : "lax",
  },
};

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
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: true,
  tlsAllowInvalidHostnames: true,
  retryWrites: true,
  w: "majority",
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Function to connect to MongoDB with retry logic
const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.DATABASE, dbOptions);
    console.log("MongoDB connected successfully");
    console.log("Database name:", mongoose.connection.name);
    console.log("Connection state:", mongoose.connection.readyState);
    console.log(
      "Using session store:",
      isProduction ? "MongoStore" : "MemoryStore"
    );

    // Log MongoDB connection details
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(
      "Available collections:",
      collections.map((c) => c.name)
    );
  } catch (err) {
    console.error("MongoDB connection error:", err);
    console.log("Retrying connection in 5 seconds...");
    setTimeout(connectWithRetry, 5000);
  }
};

// Initial connection attempt
connectWithRetry();

// Add connection event handlers
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected. Attempting to reconnect...");
  connectWithRetry();
});

mongoose.connection.on("connected", () => {
  console.log("MongoDB connected");
});

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
app.use(express.json());

// Trust proxy in production
if (isProduction) {
  app.set("trust proxy", 1);
}

// Add request logging middleware with more details
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${new Date().toISOString()} - ${req.method} ${req.url} - ${
        res.statusCode
      } - ${duration}ms`
    );
    console.log("Session ID:", req.sessionID);
    if (req.session && req.session.user) {
      console.log("User logged in:", req.session.user.email);
    }
  });
  next();
});

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
  console.log("MongoDB connection state:", mongoose.connection.readyState);
});
