// routes/salesAgentRoutes.js
const express = require("express");
const router = express.Router();

router.get("/salesAgentDash/:branch", (req, res) => {
  const { branch } = req.params;

  if (branch === "maganjo") {
    res.render("salesAgentMaganjo"); // salesAgentMaganjo.pug
  } else if (branch === "matugga") {
    res.render("salesAgentMatuga"); // salesAgentMatuga.pug
  } else {
    res.status(404).send("Invalid sales agent branch");
  }
});

module.exports = router;
