const express = require('express');
const router = express.Router();
const Credit = require('../models/Credit');
const Produce = require('../models/Produce');
const connectEnsureLogin = require('connect-ensure-login');

// Middleware to get user's branch from session (ensure lowercase)
function getUserBranch(req) {
    return (req.session.user?.branch || 'Matugga').toLowerCase(); // Default to Matugga and ensure lowercase
}

// Combine first and last name from session for agent name
function getAgentName(req) {
    return `${req.session.user.fname} ${req.session.user.lname}`;
}

// Render credit form (Both sales agents and managers can access this form)
router.get('/addCreditor', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    const branch = getUserBranch(req);
    const agentName = getAgentName(req);

    res.render("credit", { branch, agentName });
});

router.post('/addCreditor', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    try {
      const branch = getUserBranch(req);
      const agentName = getAgentName(req);
  
      console.log("Received credit form data:", req.body);
  
      const credit = new Credit({
        ...req.body,
        agentName,
        branch
      });
  
      console.log("Saving credit entry:", credit);
      await credit.save();
  
      console.log("Credit saved successfully!");
      res.redirect('/addCreditor?success=1');
    } catch (error) {
      console.error("Error saving credit entry:", error);
      res.status(500).render("credit", {
        branch: getUserBranch(req),
        agentName: getAgentName(req),
        error: 'Error submitting credit form. Please try again later.'
      });
    }
  });
  
// View credit entries for the user's branch
router.get('/viewCredits', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    const branch = getUserBranch(req);

    try {
        const credits = await Credit.find({ branch }).sort({ createdAt: -1 });
        res.render('creditList', { credits, branch });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching credit entries');
    }
});

// Edit credit entry (Only managers)
router.get('/editCredit/:id', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    if (req.session.user.role !== 'manager') {
        return res.redirect('/');
    }

    try {
        const credit = await Credit.findById(req.params.id);
        if (!credit) return res.redirect('/viewCredits');

        const branch = getUserBranch(req);
        const agentName = getAgentName(req);

        res.render('credit', { credit, branch, agentName, editing: true });
    } catch (error) {
        console.error(error);
        res.redirect('/viewCredits');
    }
});

// Update credit (Only managers)
router.post('/editCredit/:id', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    if (req.session.user.role !== 'manager') {
        return res.redirect('/');
    }

    try {
        await Credit.findByIdAndUpdate(req.params.id, req.body);
        res.redirect('/viewCredits');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating credit entry');
    }
});

// Delete credit (Only managers)
router.post('/deleteCredit/:id', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    if (req.session.user.role !== 'manager') {
        return res.redirect('/');
    }

    try {
        await Credit.findByIdAndDelete(req.params.id);
        res.redirect('/viewCredits');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting credit entry');
    }
});

// NEW ROUTE: Get salePrice and tonnage for a produce from produces collection
router.get('/getProduceInfo', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    const { produceName } = req.query;
    const rawBranch = req.session.branch || 'Matugga';
    const branch = rawBranch.toLowerCase(); // Normalize to lowercase

    console.log('Received query:', { produceName, branch });

    try {
        const produce = await Produce.findOne({ produceName, branch }).sort({ createdAt: -1 });

        console.log('MongoDB query result:', produce);

        if (!produce) {
            console.warn(`Produce not found for produceName: ${produceName} and branch: ${branch}`);
            return res.status(404).json({ error: 'Produce not found' });
        } 

        res.json({ salePrice: produce.salePrice, tonnage: produce.tonnage });
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

  
module.exports = router;
