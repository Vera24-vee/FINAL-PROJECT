const express = require('express');
const router = express.Router();
const Credit = require('../models/Credit');
const Produce = require('../models/Produce');
const connectEnsureLogin = require('connect-ensure-login');

// Middleware to get user's branch
function getUserBranch(req) {
    return (req.session.user?.branch || 'Matugga').toLowerCase();
}

// Get full name
function getAgentName(req) {
    return `${req.session.user.fname} ${req.session.user.lname}`;
}

// Render form
router.get('/addCreditor', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    const branch = getUserBranch(req);
    const agentName = getAgentName(req);
    res.render("credit", { branch, agentName });
});

// Add credit + adjust stock
router.post('/addCreditor', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    try {
        const branch = getUserBranch(req);
        const agentName = getAgentName(req);

        const credit = new Credit({
            ...req.body,
            agentName,
            branch
        });

        // Reduce stock in Produce
        const produce = await Produce.findOne({ produceName: req.body.productName, branch });
        if (produce) {
            produce.tonnage -= parseFloat(req.body.tonnage);
            await produce.save();
        }

        await credit.save();
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

// View credits
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

// Edit credit (Only managers)
router.get('/editCredit/:id', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    if (req.session.user.role !== 'manager') return res.redirect('/');

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

// Update credit + restore old stock + subtract new
router.post('/editCredit/:id', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    if (req.session.user.role !== 'manager') return res.redirect('/');

    try {
        const existing = await Credit.findById(req.params.id);
        const branch = getUserBranch(req);
        const newTonnage = parseFloat(req.body.tonnage);
        const productName = req.body.productName;

        // Restore old tonnage
        const produce = await Produce.findOne({ produceName: existing.productName, branch });
        if (produce) {
            produce.tonnage += parseFloat(existing.tonnage);
            await produce.save();
        }

        // Subtract new tonnage
        const updatedProduce = await Produce.findOne({ produceName: productName, branch });
        if (updatedProduce) {
            updatedProduce.tonnage -= newTonnage;
            await updatedProduce.save();
        }

        await Credit.findByIdAndUpdate(req.params.id, req.body);
        res.redirect('/viewCredits');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating credit entry');
    }
});

// Delete credit + restore stock
router.post('/deleteCredit/:id', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    if (req.session.user.role !== 'manager') return res.redirect('/');

    try {
        const credit = await Credit.findById(req.params.id);
        const branch = getUserBranch(req);

        if (credit) {
            const produce = await Produce.findOne({ produceName: credit.productName, branch });
            if (produce) {
                produce.tonnage += parseFloat(credit.tonnage);
                await produce.save();
            }
            await credit.deleteOne();
        }

        res.redirect('/viewCredits');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting credit entry');
    }
});

// Get produce info
router.get('/getProduceInfo', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    const { produceName } = req.query;
    const branch = getUserBranch(req);

    try {
        const produce = await Produce.findOne({ produceName, branch }).sort({ createdAt: -1 });

        if (!produce) {
            return res.status(404).json({ error: 'Produce not found' });
        }

        res.json({ salePrice: produce.salePrice, tonnage: produce.tonnage });
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
