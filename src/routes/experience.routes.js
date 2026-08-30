const express = require("express");
const { ObjectId } = require("mongodb");
const { collections } = require("../config/db");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

router.post(
  "/experience",
  asyncHandler(async (req, res) => {
    const result = await collections.experience().insertOne(req.body);
    res.send(result);
  })
);

router.get(
  "/experience/:email",
  asyncHandler(async (req, res) => {
    const result = await collections
      .experience()
      .find({ userEmail: req.params.email })
      .sort({ _id: -1 })
      .toArray();
    res.send(result);
  })
);

router.get(
  "/experiences",
  asyncHandler(async (req, res) => {
    const result = await collections.experience().find().sort({ _id: -1 }).toArray();
    res.send(result);
  })
);

router.put(
  "/updateExperience/:id",
  asyncHandler(async (req, res) => {
    const filter = { _id: new ObjectId(req.params.id) };
    const { time, year, role, institute } = req.body;
    const result = await collections
      .experience()
      .updateOne(filter, { $set: { time, year, role, institute } });
    res.send(result);
  })
);

router.delete(
  "/deleteExperience/:id",
  asyncHandler(async (req, res) => {
    const result = await collections.experience().deleteOne({ _id: new ObjectId(req.params.id) });
    res.send(result);
  })
);

module.exports = router;
