const express = require("express");
const { ObjectId } = require("mongodb");
const { collections } = require("../config/db");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

router.get(
  "/interest/:email",
  asyncHandler(async (req, res) => {
    const result = await collections
      .interests()
      .find({ userEmail: req.params.email })
      .sort({ _id: -1 })
      .toArray();
    res.send(result);
  })
);

router.post(
  "/interest",
  asyncHandler(async (req, res) => {
    const result = await collections.interests().insertOne(req.body);
    res.send(result);
  })
);

router.get(
  "/interests",
  asyncHandler(async (req, res) => {
    const result = await collections.interests().find().sort({ _id: -1 }).toArray();
    res.send(result);
  })
);

router.put(
  "/updateInterest/:id",
  asyncHandler(async (req, res) => {
    const filter = { _id: new ObjectId(req.params.id) };
    const result = await collections
      .interests()
      .updateOne(filter, { $set: { interest: req.body.interest } });
    res.send(result);
  })
);

router.delete(
  "/deleteInterest/:id",
  asyncHandler(async (req, res) => {
    const result = await collections.interests().deleteOne({ _id: new ObjectId(req.params.id) });
    res.send(result);
  })
);

module.exports = router;
