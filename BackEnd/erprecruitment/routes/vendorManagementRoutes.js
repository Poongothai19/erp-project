const express = require("express");
const router = express.Router();
const {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  getVendorStats
} = require("../controllers/vendorManagementController");
const { authenticateToken } = require("../../Recruitment/middleWare/authMiddleware");

router.get("/", authenticateToken, getAllVendors);
router.get("/stats", authenticateToken, getVendorStats);
router.get("/:id", authenticateToken, getVendorById);
router.post("/", authenticateToken, createVendor);
router.put("/:id", authenticateToken, updateVendor);
router.delete("/:id", authenticateToken, deleteVendor);

module.exports = router;