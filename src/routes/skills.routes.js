const express = require("express");
const { ObjectId } = require("mongodb");
const { collections } = require("../config/db");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

router.post(
  "/skill",
  asyncHandler(async (req, res) => {
    const result = await collections.skills().insertOne(req.body);
    res.send(result);
  })
);

router.get(
  "/skills",
  asyncHandler(async (req, res) => {
    const result = await collections.skills().find().sort({ _id: -1 }).toArray();
    res.send(result);
  })
);

router.get(
  "/skills/:email",
  asyncHandler(async (req, res) => {
    const result = await collections
      .skills()
      .find({ userEmail: req.params.email })
      .sort({ _id: -1 })
      .toArray();
    res.send(result);
  })
);

router.put(
  "/updateSkill/:id",
  asyncHandler(async (req, res) => {
    const filter = { _id: new ObjectId(req.params.id) };
    const result = await collections.skills().updateOne(filter, { $set: { skills: req.body.skills } });
    res.send(result);
  })
);

router.delete(
  "/deleteSkill/:id",
  asyncHandler(async (req, res) => {
    const result = await collections.skills().deleteOne({ _id: new ObjectId(req.params.id) });
    res.send(result);
  })
);

module.exports = router;
