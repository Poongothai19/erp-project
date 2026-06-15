// erprecruitment/routes/linkedin.js
const express = require("express");
const router = express.Router();
const { handleLinkedInPost } = require("../controllers/linkedinController");

// LinkedIn post route - NO AUTHENTICATION REQUIRED
// This route is accessed from email links, so it must be public
router.get("/post", handleLinkedInPost);

// Optional: Add a test route to verify LinkedIn routes work
router.get("/test", (req, res) => {
  res.json({ 
    message: "LinkedIn routes are working", 
    timestamp: new Date().toISOString(),
    note: "Post route is public (no auth required)"
  });
});

module.exports = router;