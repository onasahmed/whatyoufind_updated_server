const express = require("express");
const { ObjectId } = require("mongodb");
const { collections } = require("../config/db");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

// 🟢 নতুন: প্রোফাইল রিভিউ/রেটিং সিস্টেম — আগে Publicachieve.jsx-এ পুরোপুরি hardcoded
// fake "182 reviews" দেখাতো। এখন প্রতিটা প্রোফাইলের নিজের real রিভিউ থাকবে।
// এখানে "owner" মানে profileEmail-এর মালিক না, বরং reviewer নিজে — কারণ রিভিউ অন্য কেউ
// লেখে, প্রোফাইলের মালিক না। তাই শুধু যে রিভিউ লিখেছে সে-ই সেটা এডিট/ডিলিট করতে পারবে।

router.post(
  "/reviews",
  asyncHandler(async (req, res) => {
    const requesterEmail = (req.headers["user-email"] || "").trim().toLowerCase();
    const { profileEmail, reviewerEmail, reviewerName, rating, text } = req.body;

    const normalizedReviewer = (reviewerEmail || "").trim().toLowerCase();
    const normalizedProfile = (profileEmail || "").trim().toLowerCase();

    if (!requesterEmail || requesterEmail !== normalizedReviewer) {
      return res.status(403).send({ success: false, message: "You can only post a review as yourself." });
    }
    if (!normalizedProfile) {
      return res.status(400).send({ success: false, message: "profileEmail is required." });
    }
    if (normalizedProfile === normalizedReviewer) {
      return res.status(400).send({ success: false, message: "You can't review your own profile." });
    }
    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).send({ success: false, message: "Rating must be between 1 and 5." });
    }
    if (!text?.trim()) {
      return res.status(400).send({ success: false, message: "Review text is required." });
    }

    const review = {
      profileEmail: normalizedProfile,
      reviewerEmail: normalizedReviewer,
      reviewerName: reviewerName || "User",
      rating: numericRating,
      text: text.trim(),
      createdAt: new Date(),
    };

    const result = await collections.reviews().insertOne(review);
    res.status(201).send({ success: true, insertedId: result.insertedId, review });
  })
);

router.get(
  "/reviews/:email",
  asyncHandler(async (req, res) => {
    const email = (req.params.email || "").trim().toLowerCase();
    const result = await collections
      .reviews()
      .find({ profileEmail: email })
      .sort({ _id: -1 })
      .toArray();
    res.send(result);
  })
);

router.put(
  "/updateReview/:id",
  asyncHandler(async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).send({ success: false, message: "Invalid id" });
    }
    const requesterEmail = (req.headers["user-email"] || "").trim().toLowerCase();
    const doc = await collections.reviews().findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return res.status(404).send({ success: false, message: "Review not found" });
    if (!requesterEmail || requesterEmail !== doc.reviewerEmail) {
      return res.status(403).send({ success: false, message: "You can only edit your own review." });
    }

    const { rating, text } = req.body;
    const update = {};
    if (rating) {
      const numericRating = Number(rating);
      if (!numericRating || numericRating < 1 || numericRating > 5) {
        return res.status(400).send({ success: false, message: "Rating must be between 1 and 5." });
      }
      update.rating = numericRating;
    }
    if (text) update.text = text.trim();

    const result = await collections.reviews().updateOne({ _id: doc._id }, { $set: update });
    res.send(result);
  })
);

router.delete(
  "/deleteReview/:id",
  asyncHandler(async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).send({ success: false, message: "Invalid id" });
    }
    const requesterEmail = (req.headers["user-email"] || "").trim().toLowerCase();
    const doc = await collections.reviews().findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return res.status(404).send({ success: false, message: "Review not found" });
    if (!requesterEmail || requesterEmail !== doc.reviewerEmail) {
      return res.status(403).send({ success: false, message: "You can only delete your own review." });
    }

    const result = await collections.reviews().deleteOne({ _id: doc._id });
    res.send({ success: true, deletedCount: result.deletedCount });
  })
);

module.exports = router;
