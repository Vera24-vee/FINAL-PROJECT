const express = require("express");
const router = express.Router();

router.get("/directorDash", (req, res) => {
    res.render("directorDashboard");
  });

  router.get("/reports", (req, res) => {
    res.render("reports"); 
});

module.exports = router;
