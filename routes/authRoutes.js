const express = require("express");
const router = express.Router();
const connectEnsureLogin = require("connect-ensure-login");
const Signup = require("../models/Signup");
const passport = require("passport");
const mongoose = require("mongoose");

// SUPERUSER DETAILS - Using environment variables
const SUPERUSER_EMAIL = process.env.SUPERUSER_EMAIL;
const SUPERUSER_PASSWORD = process.env.SUPERUSER_PASSWORD;
const SUPERUSER = {
  _id: process.env.SUPERUSER_ID || "superuser123",
  fname: process.env.SUPERUSER_FNAME || "Admin",
  lname: process.env.SUPERUSER_LNAME || "User",
  email: SUPERUSER_EMAIL,
  role: "superuser",
  get: function (key) {
    return this[key];
  },
};

// Add validation for required environment variables
if (!SUPERUSER_EMAIL || !SUPERUSER_PASSWORD) {
  console.error(
    "WARNING: Superuser credentials not set in environment variables!"
  );
  console.error(
    "Please set SUPERUSER_EMAIL and SUPERUSER_PASSWORD in your environment."
  );
}

// Add this function to check database connection and users
async function checkDatabaseStatus() {
  try {
    const dbState = mongoose.connection.readyState;
    console.log("Database connection state:", {
      state: dbState,
      meaning: {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
      }[dbState],
    });

    // Get all users (excluding sensitive data)
    const users = await Signup.find({}, "email role branch");
    console.log(
      "Available users in database:",
      users.map((u) => ({
        email: u.email,
        role: u.role,
        branch: u.branch,
      }))
    );

    return {
      connected: dbState === 1,
      userCount: users.length,
    };
  } catch (error) {
    console.error("Database check error:", error);
    return {
      connected: false,
      error: error.message,
    };
  }
}

// GET Signup Page (Only for superuser, manager, or director, no login required for superuser)
router.get("/signup", (req, res) => {
  const currentUser = req.session.user;

  // Allow superuser to access signup page even if not logged in
  if (
    currentUser &&
    (currentUser.email === SUPERUSER_EMAIL ||
      currentUser.role === "manager" ||
      currentUser.role === "director")
  ) {
    const branchFromSession =
      currentUser.role === "manager" ? currentUser.branch : null;
    res.render("signup", {
      editing: false,
      user: null,
      branchFromSession,
      error: null,
      currentUser,
    });
  } else {
    res
      .status(403)
      .send(
        "Access denied. Only superusers, managers, or directors can access this page."
      );
  }
});

// POST Signup (Create New User)
router.post("/signup", async (req, res) => {
  const currentUser = req.session.user;

  if (
    currentUser.email === SUPERUSER_EMAIL || // Superuser can add any user
    currentUser.role === "manager" ||
    currentUser.role === "director"
  ) {
    try {
      const existingUser = await Signup.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).render("signup", {
          editing: false,
          user: null,
          branchFromSession: currentUser.branch,
          error: "Email already in use",
          currentUser,
        });
      }

      const user = new Signup(req.body);

      // If the current user is a manager, force the user to the same branch
      if (currentUser.role === "manager") {
        user.branch = currentUser.branch;
      }

      // If the current user is superuser, allow them to assign any role (including director)
      if (currentUser.email === SUPERUSER_EMAIL) {
        // Superuser logic: No restriction on role assignment
      }

      await Signup.register(user, req.body.password, (error) => {
        if (error) throw error;
        res.redirect("/signup");
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).render("signup", {
        editing: false,
        user: null,
        branchFromSession: currentUser.branch,
        error: "There was an error during signup",
        currentUser,
      });
    }
  } else {
    return res
      .status(403)
      .send(
        "Access denied. Only superusers, managers, or directors can add users."
      );
  }
});

// GET Edit User (Requires login)
router.get(
  "/editUser/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const currentUser = req.session.user;

    if (currentUser.role !== "manager" && currentUser.role !== "director") {
      return res.status(403).send("Access denied.");
    }

    try {
      const user = await Signup.findById(req.params.id);
      if (!user) return res.redirect("/userTable");

      res.render("signup", {
        editing: true,
        user,
        branchFromSession: currentUser.branch,
        error: null,
        currentUser,
      });
    } catch (error) {
      console.error("Error loading user:", error);
      res.redirect("/userTable");
    }
  }
);

// POST Edit User (Requires login)
router.post(
  "/editUser/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const currentUser = req.session.user;

    if (currentUser.role !== "manager" && currentUser.role !== "director") {
      return res.status(403).send("Access denied.");
    }

    try {
      const updateData = { ...req.body };
      if (currentUser.role === "manager") {
        updateData.branch = currentUser.branch;
      }

      await Signup.findByIdAndUpdate(req.params.id, updateData);
      res.redirect("/userTable");
    } catch (error) {
      console.error("Error updating user:", error);
      res.redirect("/userTable");
    }
  }
);

// DELETE User (Requires login and role check)
router.post(
  "/deleteUser/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const currentUser = req.session.user;

    if (currentUser.role !== "director") {
      return res
        .status(403)
        .send("Access denied. Only directors can delete users.");
    }

    try {
      await Signup.findByIdAndDelete(req.params.id);
      res.redirect("/userTable");
    } catch (error) {
      console.error("Error deleting user:", error);
      res.redirect("/userTable");
    }
  }
);

// LOGIN Route for Superuser and other users
router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for email:", email);
    console.log("Environment:", process.env.NODE_ENV);

    // Check database status
    const dbStatus = await checkDatabaseStatus();
    console.log("Database status:", dbStatus);

    // Input validation
    if (!email || !password) {
      console.log("Login attempt with missing credentials");
      return res.render("login", { error: "Email and password are required" });
    }

    // Check if user exists before authentication
    const userExists = await Signup.findOne({ email });
    console.log("User exists check:", {
      email,
      exists: !!userExists,
      role: userExists?.role,
      branch: userExists?.branch,
      database: mongoose.connection.name,
    });

    // Superuser login handling
    if (email === SUPERUSER_EMAIL && password === SUPERUSER_PASSWORD) {
      console.log("Superuser login attempt");
      req.login(SUPERUSER, function (err) {
        if (err) {
          console.error("Superuser login error:", err);
          return res.render("login", {
            error: "Login failed. Please try again.",
          });
        }
        console.log("Superuser login successful");
        req.session.user = SUPERUSER;
        req.session.save((err) => {
          if (err) {
            console.error("Error saving superuser session:", err);
            return res.render("login", {
              error: "Session error. Please try again.",
            });
          }
          console.log("Superuser session saved successfully");
          return res.redirect("/directorDash");
        });
      });
      return;
    }

    passport.authenticate(
      "local",
      { failureRedirect: "/login" },
      (err, user, info) => {
        if (err) {
          console.error("Authentication error:", err);
          return res.render("login", {
            error: "An error occurred during login. Please try again.",
          });
        }

        if (!user) {
          console.log("Login attempt failed for email:", email, "Info:", info);
          return res.render("login", {
            error: "Invalid email or password",
            email: email, // Pass email back to form for better UX
          });
        }

        console.log("User found, attempting login:", {
          email: user.email,
          role: user.role,
          branch: user.branch,
        });

        req.login(user, function (err) {
          if (err) {
            console.error("Session login error:", err);
            return res.render("login", {
              error: "Failed to create session. Please try again.",
              email: email,
            });
          }

          try {
            console.log("Setting user session");
            req.session.user = user;
            const { role, branch } = user;
            const lowerRole = role?.toLowerCase();
            const lowerBranch = branch?.toLowerCase();

            console.log("User role and branch:", {
              role: lowerRole,
              branch: lowerBranch,
            });

            if (!lowerRole) {
              throw new Error("User role is missing");
            }

            // Save session before redirect
            req.session.save((err) => {
              if (err) {
                console.error("Error saving user session:", err);
                return res.render("login", {
                  error: "Session error. Please try again.",
                  email: email,
                });
              }

              console.log("Session saved successfully, redirecting...");
              if (lowerRole === "manager" || lowerRole === "sales-agent") {
                if (!lowerBranch) {
                  throw new Error(`Branch missing for ${lowerRole}`);
                }
                return res.redirect(`/${lowerRole}Dash/${lowerBranch}`);
              }

              if (lowerRole === "director") {
                return res.redirect("/directorDash");
              }

              throw new Error(`Unknown role: ${lowerRole}`);
            });
          } catch (error) {
            console.error("Role-based redirect error:", error);
            return res.render("login", {
              error: "Error processing user role. Please contact support.",
              email: email,
            });
          }
        });
      }
    )(req, res, next);
  } catch (error) {
    console.error("Login route error:", error);
    res.render("login", {
      error: "An unexpected error occurred. Please try again.",
      email: req.body.email,
    });
  }
});

// LOGOUT Route
router.get("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy((error) => {
      if (error) return res.status(500).send("Error logging out");
      res.redirect("/");
    });
  }
});

// GET User Table (Modified to handle superuser access)
router.get("/userTable", async (req, res) => {
  const currentUser = req.session.user;

  // Check if user is logged in
  if (!currentUser) {
    return res.redirect("/login");
  }

  try {
    let users;
    // Allow superuser to see all users
    if (
      currentUser.email === SUPERUSER_EMAIL ||
      currentUser.role?.toLowerCase() === "director"
    ) {
      users = await Signup.find({});
    } else {
      users = await Signup.find({ branch: currentUser.branch });
    }

    res.render("usersList", { users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Error fetching users entries");
  }
});

// Add a new route to check database status (for debugging)
router.get("/check-db", async (req, res) => {
  try {
    const status = await checkDatabaseStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
