const express = require("express");
const router = express.Router();
const {
  getAllRecruiters,
  createRecruiter,
  getRecruiterStats
} = require("../controllers/recruiterController");
const { authenticateToken } = require("../../Recruitment/middleWare/authMiddleware");

router.get("/", authenticateToken, getAllRecruiters);
router.post("/", authenticateToken, createRecruiter);
router.get("/:id/stats", authenticateToken, getRecruiterStats);

module.exports = router;