const express = require("express");
const { collections } = require("../config/db");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

// Create a user (rejects if the email is already registered)
router.post(
  "/users",
  asyncHandler(async (req, res) => {
    const user = req.body;
    const existingUser = await collections.users().findOne({ email: user.email });

    if (existingUser) {
      return res.status(400).send({ message: "User with this email already exists" });
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

    if (displayName) {
      await collections.posts().updateMany(
        { userEmail: email },
        { $set: { userName: displayName } }
      );
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
      // .reverse() (not the old always-return-(-1) comparator, which didn't
      // reliably sort) — newest-pushed picture first.
      user.profilePics = [...user.profilePics].reverse();
    }
    res.send(user);
  })
);

module.exports = router;
