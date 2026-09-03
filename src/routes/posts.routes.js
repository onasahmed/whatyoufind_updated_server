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

// 🟡 ৩. ইমেইল অনুযায়ী পোস্ট গেট
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
// FIX: এখন এটা —
//   (ক) homePosts, services, products — তিনটা কালেকশনই চেক করে (আগে products চেক হতো না,
//       তাই products কালেকশনে থাকা item ডিলিট "সাকসেস" popup দেখাতো কিন্তু আসলে ডিলিট হতো না)
//   (খ) request-এর user-email header আসল owner-এর email-এর সাথে না মিললে 403 দিয়ে ব্লক করে
//       (আগে কোনো ownership check-ই ছিল না, তাই যেকোনো user যেকোনো post/service delete করতে পারতো)
const deleteHandler = async (req, res) => {
  try {
    const id = req.params.id;
    const requesterEmail = req.headers["user-email"];

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid ID format", deletedCount: 0 });
    }

    if (!requesterEmail) {
      return res.status(401).send({
        success: false,
        message: "Missing user-email header — cannot verify ownership",
        deletedCount: 0,
      });
    }

    const objectId = new ObjectId(id);
    const emailRegex = new RegExp(`^${requesterEmail.trim()}$`, "i");

    // homePosts, services, products — তিনটা কালেকশনই চেক করা হচ্ছে
    const collectionsToCheck = [
      collections.homePosts(),
      collections.services(),
      collections.products(),
    ];

    for (const col of collectionsToCheck) {
      const doc = await col.findOne({ _id: objectId });
      if (!doc) continue;

      const ownerEmail = doc.userEmail || doc.email;

      // আসল owner-এর email এর সাথে না মিললে delete করতে দেওয়া হবে না
      if (!ownerEmail || !emailRegex.test(ownerEmail)) {
        return res.status(403).send({
          success: false,
          message: "You are not allowed to delete someone else's post/service",
          deletedCount: 0,
        });
      }

      const result = await col.deleteOne({ _id: objectId });
      return res.send({
        success: true,
        message: "Deleted successfully",
        deletedCount: result.deletedCount,
      });
    }

    // কোনো কালেকশনেই পাওয়া যায়নি
    return res.status(404).send({ success: false, message: "Post/Service not found", deletedCount: 0 });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).send({ message: error.message, deletedCount: 0 });
  }
};

router.delete("/posts/deletePost/:id", deleteHandler);
router.delete("/deleteService/:id", deleteHandler);

// 🟢 Helper: id দিয়ে homePosts/services/products — যেকোনো কালেকশনে ডকুমেন্ট খুঁজে বের করা
// like/comment তো homePosts (সাধারণ post/service/product/training সবই এখানে
// আসে Homesubheader থেকে) আর legacy services/products কালেকশন — যেকোনো জায়গায় থাকতে পারে
const findDocAndCollection = async id => {
  if (!ObjectId.isValid(id)) return null;
  const objectId = new ObjectId(id);
  const collectionsToCheck = [
    collections.homePosts(),
    collections.services(),
    collections.products(),
  ];

  for (const col of collectionsToCheck) {
    const doc = await col.findOne({ _id: objectId });
    if (doc) return { col, doc, objectId };
  }
  return null;
};

// 🟢 ৬. Like টগল করা — যেকোনো লগইন করা user like/unlike করতে পারবে (owner হওয়া লাগবে না)
router.post(
  "/posts/:id/like",
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).send({ success: false, message: "email is required" });
    }

    const found = await findDocAndCollection(req.params.id);
    if (!found) {
      return res.status(404).send({ success: false, message: "Post not found" });
    }

    const { col, doc, objectId } = found;
    const emailLower = email.toLowerCase();
    const likedBy = Array.isArray(doc.likedBy) ? doc.likedBy : [];
    const alreadyLiked = likedBy.includes(emailLower);

    await col.updateOne(
      { _id: objectId },
      alreadyLiked
        ? { $pull: { likedBy: emailLower } }
        : { $addToSet: { likedBy: emailLower } }
    );

    const updatedDoc = await col.findOne({ _id: objectId });
    res.send({
      success: true,
      liked: !alreadyLiked,
      likesCount: (updatedDoc.likedBy || []).length,
      likedBy: updatedDoc.likedBy || [],
    });
  })
);

// 🟢 ৭. কমেন্ট যোগ করা — যেকোনো লগইন করা user কমেন্ট করতে পারবে
router.post(
  "/posts/:id/comment",
  asyncHandler(async (req, res) => {
    const { email, name, text } = req.body;
    if (!email || !text?.trim()) {
      return res.status(400).send({ success: false, message: "email and text are required" });
    }

    const found = await findDocAndCollection(req.params.id);
    if (!found) {
      return res.status(404).send({ success: false, message: "Post not found" });
    }

    const { col, objectId } = found;
    const comment = {
      _id: new ObjectId(),
      email: email.toLowerCase(),
      name: name || "User",
      text: text.trim(),
      createdAt: new Date(),
    };

    await col.updateOne({ _id: objectId }, { $push: { comments: comment } });
    const updatedDoc = await col.findOne({ _id: objectId });
    res.send({ success: true, comments: updatedDoc.comments || [] });
  })
);

module.exports = router;
