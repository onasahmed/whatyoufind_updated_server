const express = require("express");
const { ObjectId } = require("mongodb");
const { collections } = require("../config/db");
const asyncHandler = require("../middleware/asyncHandler");
const { requireOwnerOnCreate, requireOwnerOnExisting } = require("../middleware/requireOwner");

const router = express.Router();

router.get(
  "/record/:email",
  asyncHandler(async (req, res) => {
    const result = await collections
      .records()
      .find({ userEmail: req.params.email })
      .sort({ _id: -1 })
      .toArray();
    res.send(result);
  })
);

router.post(
  "/record",
  requireOwnerOnCreate(),
  asyncHandler(async (req, res) => {
    const result = await collections.records().insertOne(req.body);
    res.send(result);
  })
);

router.get(
  "/records",
  asyncHandler(async (req, res) => {
    const result = await collections.records().find().sort({ _id: -1 }).toArray();
    res.send(result);
  })
);

router.put(
  "/updateRecord/:id",
  requireOwnerOnExisting(collections.records),
  asyncHandler(async (req, res) => {
    const filter = { _id: new ObjectId(req.params.id) };
    const result = await collections.records().updateOne(filter, { $set: { record: req.body.record } });
    res.send(result);
  })
);

router.delete(
  "/deleteRecord/:id",
  requireOwnerOnExisting(collections.records),
  asyncHandler(async (req, res) => {
    const result = await collections.records().deleteOne({ _id: new ObjectId(req.params.id) });
    res.send(result);
  })
);

module.exports = router;
