const express = require("express");
const { ObjectId } = require("mongodb");
const { collections } = require("../config/db");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

// 🟢 ১. নতুন পোস্ট তৈরি
router.post(
  "/posts",
  asyncHandler(async (req, res) => {
    const newPost = {
      ...req.body,
      createdAt: new Date(),
    };
    const result = await collections.homePosts().insertOne(newPost);
    res.status(201).send(result);
  })
);

// 🔵 ২. সব পোস্ট গেট করা
router.get(
  "/posts",
  asyncHandler(async (req, res) => {
    const result = await collections
      .homePosts()
      .find()
      .sort({ _id: -1 })
      .toArray();
    res.send(result);
  })
);

// 🟡 ৩. ইমেইল অনুযায়ী পোস্ট গেট
router.get(
  "/posts/:email",
  asyncHandler(async (req, res) => {
    const result = await collections
      .homePosts()
      .find({ userEmail: req.params.email })
      .sort({ _id: -1 })
      .toArray();
    res.send(result);
  })
);

// 🟠 ৪. পোস্ট আপডেট
router.put(
  "/updatePost/:id",
  asyncHandler(async (req, res) => {
    const filter = { _id: new ObjectId(req.params.id) };
    const result = await collections.homePosts().updateOne(filter, {
      $set: { 
        details: req.body.details,
        image: req.body.image 
      },
    });
    res.send(result);
  })
);

// 🔴 ৫. ডিলিট রাউট (posts/deletePost এবং deleteService দুই ফ্রন্টএন্ড কলই হ্যান্ডেল করবে)
const deleteHandler = async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid ID format", deletedCount: 0 });
    }

    const objectId = new ObjectId(id);

    // ১. homePosts কালেকশন থেকে ডিলিট
    let result = await collections.homePosts().deleteOne({ _id: objectId });

    // ২. না পাওয়া গেলে services কালেকশন থেকে ডিলিট
    if (result.deletedCount === 0) {
      result = await collections.services().deleteOne({ _id: objectId });
    }

    if (result.deletedCount > 0) {
      return res.send({ success: true, message: "Deleted successfully", deletedCount: result.deletedCount });
    } else {
      return res.status(404).send({ success: false, message: "Post/Service not found", deletedCount: 0 });
    }
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).send({ message: error.message, deletedCount: 0 });
  }
};

router.delete("/posts/deletePost/:id", deleteHandler);
router.delete("/deleteService/:id", deleteHandler);

module.exports = router;