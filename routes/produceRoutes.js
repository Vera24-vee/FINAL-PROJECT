const express = require('express');
const router = express.Router();
const connectEnsureLogin = require('connect-ensure-login'); // Ensure login is used
const Produce = require('../models/Produce'); // Assuming the Produce model is correct

// Helper function to get the user's branch from the session
function getUserBranch(req) {
  const branch = req.session?.user?.branch || "Matugga"; // Default branch if not set
  console.log("User Branch:", branch);
  return branch;
}

// Show Add Form (Only Managers can add produce)
router.get('/addProduce', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  if (req.session.user.role !== 'manager') {
    return res.redirect('/'); // Redirect if user is not a manager
  }

  console.log("Rendering addProduce form...");
  const success = req.query.success;
  res.render('procure', {
    branch: getUserBranch(req),
    produce: null,
    formAction: '/addProduce',
    success,
  });
});

// Save New Produce (Only Managers can save produce)
router.post('/addProduce', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  if (req.session.user.role !== 'manager') {
    return res.redirect('/'); // Redirect if user is not a manager
  }

  try {
    console.log("Received form data for new produce:", req.body);

    // Ensure produce name, cost, and tonnage are valid before saving
    if (!req.body.produceName || !req.body.cost || !req.body.tonnage) {
      return res.redirect('/addProduce?error=1');
    }

    const produce = new Produce({
      ...req.body,
      branch: getUserBranch(req), // Ensure correct branch
    });

    console.log("Saving produce:", produce);
    await produce.save();
    console.log("Produce saved successfully!");

    res.redirect('/addProduce?success=1');
  } catch (err) {
    console.error("Error saving produce:", err);
    res.redirect('/addProduce?error=1');
  }
});

// Show Edit Form (Only Managers can edit produce)
router.get('/editProduce/:id', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  if (req.session.user.role !== 'manager') {
    return res.redirect('/'); // Redirect if user is not a manager
  }

  try {
    console.log(`Fetching produce for editing. ID: ${req.params.id}`);
    const produce = await Produce.findById(req.params.id);
    if (!produce) {
      console.error("Produce not found!");
      return res.redirect('/procurementList');
    }
    console.log("Editing produce:", produce);
    res.render('procure', { 
      branch: produce.branch, 
      produce, 
      formAction: `/editProduce/${produce._id}`,
      editing: true,
      success: null
    });
  } catch (err) {
    console.error("Error fetching produce for editing:", err);
    res.redirect('/procurementList');
  }
});

// Update Produce (Only Managers can update produce)
router.post('/editProduce/:id', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  if (req.session.user.role !== 'manager') {
    return res.redirect('/');
  }

  try {
    console.log(`Updating produce. ID: ${req.params.id}`);
    console.log("Updated data:", req.body);
    await Produce.findByIdAndUpdate(req.params.id, req.body);
    console.log("Produce updated successfully!");
    res.redirect('/procurementList');
  } catch (err) {
    console.error("Error updating produce:", err);
    res.redirect('/procurementList');
  }
});

// View Procurement List (Accessible to both Managers and Sales Agents, but with different access levels)
router.get('/procurementList', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  try {
    console.log("Fetching procurement list...");
    const branch = getUserBranch(req);
    const produces = await Produce.find({ branch }).sort({ createdAt: -1 }); // Use 'produces' here
    console.log(`Found ${produces.length} produce records for branch: ${branch}`);

    // If the user is a manager, they can see all data, but sales agents can only view
    if (req.session.user.role === 'manager') {
      res.render('procureTable', { branch, produces }); // Allow manager to view, edit, and delete
    } else {
      // For sales agents, they can only view the list, not edit or delete
      res.render('procureTable', { branch, produces, readOnly: true }); // Pass a flag to disable edit and delete buttons
    }

  } catch (err) {
    console.error("Error fetching procurement list:", err);
    res.status(500).send('Server error');
  }
});

// Delete Produce (Only Managers can delete produce)
router.post('/deleteProduce/:id', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  if (req.session.user.role !== 'manager') {
    return res.redirect('/'); // Redirect if user is not a manager
  }

  try {
    console.log(`Deleting produce. ID: ${req.params.id}`);
    await Produce.findByIdAndDelete(req.params.id);
    console.log("Produce deleted successfully!");
    res.redirect('/procurementList');
  } catch (err) {
    console.error("Error deleting produce:", err);
    res.redirect('/procurementList');
  }
});

module.exports = router;
