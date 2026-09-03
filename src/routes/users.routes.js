const express = require("express");
const { collections } = require("../config/db");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

// 🟢 সব ইউজারের লিস্ট (message পপআপে "real user" খোঁজার জন্য দরকার)
// পাসওয়ার্ড জাতীয় sensitive কিছু এখানে স্টোর হয় না (auth Firebase দিয়ে হয়),
// তাও শুধু দরকারি ফিল্ডগুলোই পাঠানো হচ্ছে
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const users = await collections
      .users()
      .find(
        {},
        {
          projection: {
            email: 1,
            displayName: 1,
            profilePics: 1,
            photoURL: 1,
            profession: 1,
          },
        }
      )
      .toArray();
    res.send(users);
  })
);

// Create a user (rejects if the email is already registered)
// Create a user (rejects if the email is already registered)
router.post(
  "/users",
  asyncHandler(async (req, res) => {
    const user = req.body;
    const existingUser = await collections.users().findOne({ email: user.email });

    if (existingUser) {
      // 🟢 res.status(400) এর বদলে res.status(200) রিটার্ন করুন
      return res.status(200).send({ message: "User with this email already exists", insertedId: null });
    }

    const result = await collections.users().insertOne(user);
    res.send(result);
  })
);

// Get a single user by email
router.get(
  "/users/:email",
  asyncHandler(async (req, res) => {
    const userData = await collections.users().findOne({ email: req.params.email });
    res.send(userData);
  })
);

// Update profile fields (phone/name/address/birth/profession) — creates the
// user document if it doesn't exist yet.
router.patch(
  "/users/:email",
  asyncHandler(async (req, res) => {
    const { phone, userName, address, birth, profession } = req.body;

    const result = await collections.users().updateOne(
      { email: req.params.email },
      {
        $set: {
          phone,
          displayName: userName,
          address,
          birth,
          profession,
          validation: true,
        },
      },
      { upsert: true }
    );

    res.send(result);
  })
);

// Update display name / address / profession, and keep existing posts'
// userName in sync when displayName changes.
router.patch(
  "/updateUser/:email",
  asyncHandler(async (req, res) => {
    const email = req.params.email;
    const { displayName, address, profession } = req.body;

    // 🟢 FIX: এখানে ভুল কালেকশন (posts) আপডেট হচ্ছিলো, কিন্তু আসল পোস্ট/কমেন্ট
    // homePosts কালেকশনে থাকে (দেখুন src/routes/posts.routes.js) — তাই নাম বদলালেও
    // পুরনো পোস্টের userName কখনো সিঙ্ক হতো না। এখন homePosts + services + products
    // তিনটাতেই owner-এর userName আপডেট হবে যাতে পোস্ট/কমেন্ট সবখানে নতুন নাম দেখায়।
    if (displayName) {
      await Promise.all([
        collections.homePosts().updateMany(
          { userEmail: email },
          { $set: { userName: displayName } }
        ),
        collections.services().updateMany(
          { $or: [{ userEmail: email }, { email }] },
          { $set: { userName: displayName } }
        ),
        collections.products().updateMany(
          { $or: [{ userEmail: email }, { email }] },
          { $set: { userName: displayName } }
        ),
      ]);
    }

    const updateData = {};
    if (displayName) updateData.displayName = displayName;
    if (address) updateData.address = address;
    if (profession) updateData.profession = profession;

    let result = null;
    if (Object.keys(updateData).length > 0) {
      result = await collections.users().updateOne(
        { email },
        { $set: updateData },
        { upsert: true }
      );
    }

    if (result && result.matchedCount > 0) {
      res.send(result);
    } else if (result && result.upsertedCount > 0) {
      res.send({ success: true, message: "User created successfully", result });
    } else {
      res.send({ success: false, message: "No user found to update or create" });
    }
  })
);

// Append a new profile picture URL
router.post(
  "/userProfilePic/:email",
  asyncHandler(async (req, res) => {
    const { imageUrl } = req.body;
    const result = await collections.users().updateOne(
      { email: req.params.email },
      { $push: { profilePics: imageUrl } },
      { upsert: true }
    );
    res.send(result);
  })
);

// Get a user with profilePics ordered newest-first
router.get(
  "/getProfilePic/:email",
  asyncHandler(async (req, res) => {
    const user = await collections.users().findOne({ email: req.params.email });
    if (user && Array.isArray(user.profilePics)) {
      user.profilePics = [...user.profilePics].reverse();
    }
    res.send(user);
  })
);

module.exports = router;