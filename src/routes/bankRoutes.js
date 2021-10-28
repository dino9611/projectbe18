const express = require("express");

const router = express.Router();
const { bankControllers } = require("./../controllers");

const { getBank } = bankControllers;

router.get("/", getBank);

module.exports = router;
