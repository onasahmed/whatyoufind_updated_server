const express = require("express");
const { ObjectId } = require("mongodb");
const { collections } = require("../config/db");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

router.post(
  "/edu-info",
  asyncHandler(async (req, res) => {
    const result = await collections.eduInfo().insertOne(req.body);
    res.send(result);
  })
);

router.get(
  "/all-edu-info",
  asyncHandler(async (req, res) => {
    const result = await collections.eduInfo().find().sort({ _id: -1 }).toArray();
    res.send(result);
  })
);

router.get(
  "/edu-info/:email",
  asyncHandler(async (req, res) => {
    const result = await collections
      .eduInfo()
      .find({ userEmail: req.params.email })
      .sort({ _id: -1 })
      .toArray();
    res.send(result);
  })
);

router.put(
  "/updateEdu/:id",
  asyncHandler(async (req, res) => {
    const filter = { _id: new ObjectId(req.params.id) };
    const { instituteName, departmentName, session, degree } = req.body;
    const result = await collections
      .eduInfo()
      .updateOne(filter, { $set: { instituteName, departmentName, session, degree } });
    res.send(result);
  })
);

router.delete(
  "/deleteEdu/:id",
  asyncHandler(async (req, res) => {
    const result = await collections.eduInfo().deleteOne({ _id: new ObjectId(req.params.id) });
    res.send(result);
  })
);

module.exports = router;
