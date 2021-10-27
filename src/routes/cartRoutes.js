const express = require("express");
const { verifyToken } = require("../helpers");
const router = express.Router();
const { cartControllers } = require("./../controllers");
const { verifyTokenAccess } = verifyToken;

const { addToCart, getcarts, deleteCarts, editQtyCarts } = cartControllers;

router.post("/", addToCart);
router.delete("/:carts_detail_id/:users_id", deleteCarts);
router.get("/:users_id", getcarts);
router.patch("/qty/:carts_detail_id", editQtyCarts);

module.exports = router;
