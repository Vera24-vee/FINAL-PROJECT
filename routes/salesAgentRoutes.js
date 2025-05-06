const express = require("express");
const router = express.Router();

router.get("/salesAgentDash/:branch", (req, res) => {
  const { branch } = req.params;

  if (branch === "maganjo") {
    res.render("salesAgentMaganjo"); 
  } else if (branch === "matugga") {
    res.render("salesAgentMatuga");
  } else {
    res.status(404).send("Invalid sales agent branch");
  }
});

module.exports = router;
