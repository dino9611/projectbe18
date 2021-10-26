const express = require("express");
const { uploader } = require("../helpers");
const router = express.Router();
const { productControllers } = require("./../controllers");

const { addProducts, getProducts } = productControllers;

const uploadFileProd = uploader("/products", "PROD").fields([
  { name: "image", maxCount: 3 },
]);

router.post("/", uploadFileProd, addProducts);
router.get("/", getProducts);

module.exports = router;
