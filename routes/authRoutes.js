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
  }
};

// GET Signup Page (Only for superuser, manager, or director, no login required for superuser)
router.get("/signup", (req, res) => {
  const currentUser = req.session.user;

  // Allow superuser to access signup page even if not logged in
  if (
    currentUser && (currentUser.email === SUPERUSER_EMAIL || currentUser.role === "manager" || currentUser.role === "director")
  ) {
    const branchFromSession = currentUser.role === "manager" ? currentUser.branch : null;
    res.render("signup", {
      editing: false,
      user: null,
      branchFromSession,
      error: null,
      currentUser
    });
  } else {
    res.status(403).send("Access denied. Only superusers, managers, or directors can access this page.");
  }
});

// POST Signup (Create New User)
router.post("/signup",  async (req, res) => {
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
          currentUser
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
        currentUser
      });
    }
  } else {
    return res.status(403).send("Access denied. Only superusers, managers, or directors can add users.");
  }
});

// GET Edit User (Requires login)
router.get("/editUser/:id", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
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
      currentUser
    });
  } catch (error) {
    console.error("Error loading user:", error);
    res.redirect("/userTable");
  }
});

// POST Edit User (Requires login)
router.post("/editUser/:id", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
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
});

// DELETE User (Requires login and role check)
router.post("/deleteUser/:id", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const currentUser = req.session.user;

  if (currentUser.role !== "director") {
    return res.status(403).send("Access denied. Only directors can delete users.");
  }

  try {
    await Signup.findByIdAndDelete(req.params.id);
    res.redirect("/userTable");
  } catch (error) {
    console.error("Error deleting user:", error);
    res.redirect("/userTable");
  }
});

// LOGIN Route for Superuser and other users
router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  // Superuser login handling
  if (email === SUPERUSER_EMAIL && password === SUPERUSER_PASSWORD) {
    req.login(SUPERUSER, function (err) {
      if (err) return next(err);
      req.session.user = SUPERUSER;
      return res.redirect("/directorDash");
    });
    return;
  }

  passport.authenticate("local", { failureRedirect: "/login" }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.redirect("/login");

    req.login(user, function (err) {
      if (err) return next(err);
      req.session.user = user;

      const { role, branch } = user;
      const lowerRole = role.toLowerCase();
      const lowerBranch = branch ? branch.toLowerCase() : null;

      if (lowerRole === "manager") {
        if (!lowerBranch) return res.status(400).send("Branch missing for manager");
        return res.redirect(`/managerDash/${lowerBranch}`);
      }

      if (lowerRole === "sales-agent") {
        if (!lowerBranch) return res.status(400).send("Branch missing for sales agent");
        return res.redirect(`/salesAgentDash/${lowerBranch}`);
      }

      if (lowerRole === "director") {
        return res.redirect("/directorDash");
      }

      return res.send("Unknown role");
    });
  })(req, res, next);
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
router.get("/userTable", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
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
});



module.exports = router;
