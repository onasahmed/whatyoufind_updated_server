const express = require("express");
const { ObjectId } = require("mongodb");
const { collections } = require("../config/db");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

router.post(
  "/post",
  asyncHandler(async (req, res) => {
    const result = await collections.posts().insertOne(req.body);
    res.send(result);
  })
);

router.get(
  "/posts",
  asyncHandler(async (req, res) => {
    const result = await collections.posts().find().sort({ _id: -1 }).toArray();
    res.send(result);
  })
);

router.get(
  "/posts/:email",
  asyncHandler(async (req, res) => {
    const result = await collections
      .posts()
      .find({ userEmail: req.params.email })
      .sort({ _id: -1 })
      .toArray();
    res.send(result);
  })
);

router.put(
  "/updatePost/:id",
  asyncHandler(async (req, res) => {
    const filter = { _id: new ObjectId(req.params.id) };
    const result = await collections.posts().updateOne(filter, {
      $set: { description: req.body.description },
    });
    res.send(result);
  })
);

router.delete(
  "/deletePost/:id",
  asyncHandler(async (req, res) => {
    const result = await collections.posts().deleteOne({ _id: new ObjectId(req.params.id) });
    res.send(result);
  })
);

module.exports = router;
