const express = require("express");
const router = express.Router();

const { login } = require("../controllers/authController");
router.get("/test", (req, res) => {
  res.json({ message: "Auth routes working" });
});

router.post("/login", login);

module.exports = router;