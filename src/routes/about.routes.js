const express = require("express");
const { ObjectId } = require("mongodb");
const { collections } = require("../config/db");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

router.post(
  "/about",
  asyncHandler(async (req, res) => {
    const result = await collections.about().insertOne(req.body);
    res.send(result);
  })
);

router.get(
  "/allAbout",
  asyncHandler(async (req, res) => {
    const result = await collections.about().find().sort({ _id: -1 }).toArray();
    res.send(result);
  })
);

router.get(
  "/allAbout/:email",
  asyncHandler(async (req, res) => {
    const result = await collections
      .about()
      .find({ userEmail: req.params.email })
      .sort({ _id: -1 })
      .toArray();
    res.send(result);
  })
);

router.put(
  "/updateAbout/:id",
  asyncHandler(async (req, res) => {
    const filter = { _id: new ObjectId(req.params.id) };
    const result = await collections.about().updateOne(filter, { $set: { about: req.body.about } });
    res.send(result);
  })
);

module.exports = router;
