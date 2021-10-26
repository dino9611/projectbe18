const express = require("express");
const { verifyToken } = require("../helpers");
const router = express.Router();
const { authControllers } = require("./../controllers");
const { verifyTokenAccess } = verifyToken;

const { register, login, keeplogin } = authControllers;

router.post("/register", register);
router.post("/login", login);
router.get("/keeplogin", verifyTokenAccess, keeplogin);

module.exports = router;
