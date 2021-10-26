const express = require("express");

const router = express.Router();
const { categoriesControllers } = require("./../controllers");

const { getCategories } = categoriesControllers;

router.get("/", getCategories);

module.exports = router;
