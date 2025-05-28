const express = require("express");
const router = express.Router();
const connectEnsureLogin = require("connect-ensure-login");
const Signup = require("../models/Signup");
const passport = require("passport");

// SUPERUSER DETAILS
const SUPERUSER_EMAIL = "vero@gmail.com";
const SUPERUSER_PASSWORD = "12345";
const SUPERUSER = {
  _id: "superuser123",
  fname: "Kabwaga",
  lname: "Veronica",
  email: SUPERUSER_EMAIL,
  role: "superuser", // Explicitly defining superuser role
  get: function (key) {
    return this[key];
  },
};

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
      branch: userExists?.branch
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
            email: email // Pass email back to form for better UX
          });
        }

        console.log("User found, attempting login:", {
          email: user.email,
          role: user.role,
          branch: user.branch
        });

        req.login(user, function (err) {
          if (err) {
            console.error("Session login error:", err);
            return res.render("login", {
              error: "Failed to create session. Please try again.",
              email: email
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
              branch: lowerBranch
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
                  email: email
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
              email: email
            });
          }
        });
      }
    )(req, res, next);
  } catch (error) {
    console.error("Login route error:", error);
    res.render("login", {
      error: "An unexpected error occurred. Please try again.",
      email: req.body.email
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
router.get(
  "/userTable",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const currentUser = req.session.user;
    const branch = currentUser.branch;
    const role = currentUser.role;

    try {
      let users;
      if (role.toLowerCase() === "director") {
        users = await Signup.find({});
      } else {
        users = await Signup.find({ branch });
      }

      res.render("usersList", { users });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching users entries");
    }
  }
);

module.exports = router;
