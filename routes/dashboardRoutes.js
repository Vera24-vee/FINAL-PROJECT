const express = require("express");
const router = express.Router();

router.get("/dashboard", (req, res) => {
  const { user } = req.session;

  // If the user is not logged in, redirect them to login
  if (!user) return res.redirect("/login");

  // Ensure the user has both role and branch before proceeding
  if (!user.role) {
    return res.status(400).send("Role missing in user data");
  }

  const role = user.role.toLowerCase();

  // For director: No need for branch, just redirect to director's dashboard
  if (role === "director") {
    return res.redirect("/directorDash");
  }

  // Ensure branch exists for other roles (manager or sales-agent)
  if (!user.branch) {
    return res.status(400).send("Branch missing for user");
  }

  const branch = user.branch.toLowerCase();  // Safe to call toLowerCase now

  // Redirect manager or sales-agent to their respective dashboard based on branch
  if (role === "manager") {
    return res.redirect(`/managerDash/${branch}`);
  }

  if (role === "sales-agent") {
    return res.redirect(`/salesAgentDash/${branch}`);
  }

  // If role doesn't match any of the above, send an error
  res.status(400).send("Invalid role or branch");
});

module.exports = router;
