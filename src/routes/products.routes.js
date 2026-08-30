const express = require("express");
const { collections } = require("../config/db");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

router.post(
  "/product",
  asyncHandler(async (req, res) => {
    const result = await collections.products().insertOne(req.body);
    res.send(result);
  })
);

router.get(
  "/products",
  asyncHandler(async (req, res) => {
    const result = await collections.products().find().sort({ _id: -1 }).toArray();
    res.send(result);
  })
);

router.get(
  "/products/:email",
  asyncHandler(async (req, res) => {
    const result = await collections
      .products()
      .find({ userEmail: req.params.email })
      .sort({ _id: -1 })
      .toArray();
    res.send(result);
  })
);

module.exports = router;
