const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { getDashboardStats } = require("../controllers/dashboard.controller");

const router = express.Router();

router.get("/stats", authMiddleware, getDashboardStats);

module.exports = router;
