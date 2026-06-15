const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require("../controllers/userController");
const { authenticateToken } = require("../../Recruitment/middleWare/authMiddleware");

// Protected routes - Authentication required for all routes
router.get("/users", authenticateToken, getAllUsers);
router.get("/user/:id", authenticateToken, getUserById);
router.post("/create-user", authenticateToken, createUser);
router.put("/user/:id", authenticateToken, updateUser);
router.delete("/user/:id", authenticateToken, deleteUser);

module.exports = router;