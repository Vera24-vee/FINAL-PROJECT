const express = require("express");
const router = express.Router();

router.get("/managerDash/:branch", (req, res) => {
  const { branch } = req.params;

  if (branch === "maganjo") {
    res.render("managerMaganjo"); 
  } else if (branch === "matugga") {
    res.render("managerMatugga");
  } else {
    res.status(404).send("Invalid manager branch");
  }
});








module.exports = router;
