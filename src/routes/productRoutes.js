const express = require("express");
const { uploader } = require("../helpers");
const router = express.Router();
const { productControllers } = require("./../controllers");

const { addProducts, getProducts, deleteProduct, editProduct } =
  productControllers;

const uploadFileProd = uploader("/products", "PROD").fields([
  { name: "image", maxCount: 3 },
]);

router.post("/", uploadFileProd, addProducts);
router.get("/", getProducts);
router.delete("/:id_product", deleteProduct);
router.delete("/:id_product", uploadFileProd, editProduct);

module.exports = router;
