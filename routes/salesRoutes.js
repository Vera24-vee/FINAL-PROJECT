const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
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

// Render cash sale form (Both sales agents and managers can access this form)
router.get('/addSale', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    const branch = getUserBranch(req);
    const agentName = getAgentName(req);

    res.render("sales", { branch, agentName });
});

// POST /addSale - Create a new cash sale entry
router.post("/addSale", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  try {
      const branch = getUserBranch(req);
      const agentName = getAgentName(req);

      const sale = new Sale({
          productName: req.body.productName,
          category: req.body.category,
          unitPrice: req.body.unitPrice,
          tonnage: req.body.tonnage,
          total: req.body.total,
          buyerName: req.body.buyerName,
          phone: req.body.phone,
          saleDate: req.body.saleDate,
          saleTime: req.body.saleTime,
          paymentMode: req.body.paymentMode,
          agentName,
          branch,
      });

      // Get the product details
      const produce = await Produce.findOne({ produceName: req.body.productName, branch });

      if (produce) {
          // Adjust stock after sale is made
          if (produce.tonnage >= req.body.tonnage) {
              produce.tonnage -= req.body.tonnage;
              await produce.save();
          } else {
              return res.status(400).send('Insufficient stock for this sale.');
          }
      }

      console.log("Saving sale entry:", sale);
      await sale.save();
      res.redirect("/addSale?success=1");

  } catch (error) {
      console.error("Error saving sale entry:", error);
      res.status(500).render("sale", {
          error: "Error submitting sale form. Please try again later."
      });
  }
});

// View cash sales entries for the user's branch
router.get("/viewSales", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    const branch = getUserBranch(req);

    try {
        const sales = await Sale.find({ branch }).sort({ saleDate: -1 });
        res.render("salesList", { sales, branch });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching sales entries");
    }
});

// Edit cash sale entry (Only managers)
router.get("/editSale/:id", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    if (req.session.user.role !== "manager") {
        return res.redirect("/");
    }

    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) return res.redirect("/viewSales");

        const branch = getUserBranch(req);
        const agentName = getAgentName(req);

        res.render("sales", { sale, branch, agentName, editing: true });
    } catch (error) {
        console.error(error);
        res.redirect("/viewSales");
    }
});

// POST /editSale/:id - Update cash sale entry (Only managers)
router.post("/editSale/:id", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    if (req.session.user.role !== "manager") {
        return res.redirect("/");
    }

    try {
        const oldSale = await Sale.findById(req.params.id);

        if (!oldSale) return res.redirect("/viewSales");

        // Update produce stock: Restore old tonnage, then subtract the new tonnage
        const produce = await Produce.findOne({ produceName: req.body.productName, branch: oldSale.branch });

        if (produce) {
            // Restore old tonnage first
            produce.tonnage += oldSale.tonnage;
            // Adjust for new tonnage after the update
            produce.tonnage -= req.body.tonnage;
            await produce.save();
        }

        // Update sale entry
        await Sale.findByIdAndUpdate(req.params.id, req.body);
        res.redirect("/viewSales");

    } catch (error) {
        console.error("Error updating sale entry:", error);
        res.status(500).send("Error updating sale entry");
    }
});

// POST /deleteSale/:id - Delete cash sale entry (Only managers)
router.post("/deleteSale/:id", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    if (req.session.user.role !== "manager") {
        return res.redirect("/");
    }

    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) return res.redirect("/viewSales");

        // Get the produce to restore stock
        const produce = await Produce.findOne({ produceName: sale.productName, branch: sale.branch });

        if (produce) {
            // Restore the tonnage that was used in the deleted sale
            produce.tonnage += sale.tonnage;
            await produce.save();
        }

        await Sale.findByIdAndDelete(req.params.id);
        res.redirect("/viewSales");

    } catch (error) {
        console.error("Error deleting sale entry:", error);
        res.status(500).send("Error deleting sale entry");
    }
});

// NEW ROUTE: Get salePrice and tonnage for a produce from produces collection
router.get("/getProduceInfo", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    const { produceName } = req.query;
    const branch = getUserBranch(req);

    try {
        // Fetch the produce info
        const produce = await Produce.findOne({ produceName, branch }).sort({ createdAt: -1 });

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
