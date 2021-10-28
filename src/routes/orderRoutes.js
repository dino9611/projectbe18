const express = require("express");

const router = express.Router();
const { orderControllers } = require("./../controllers");

const { checkout } = orderControllers;

router.post("/checkout", checkout);

module.exports = router;
