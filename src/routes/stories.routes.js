// const express = require("express");
// const router = express.Router();
// const { getDb } = require("../config/db");

// // 1. Get All Stories
// router.get("/", async (req, res) => {
//   try {
//     const db = getDb();
//     const storiesCollection = db.collection("stories");
//     const stories = await storiesCollection.find().sort({ createdAt: -1 }).toArray();
//     res.status(200).json(stories);
//   } catch (error) {
//     res.status(500).json({ message: "Failed to fetch stories", error: error.message });
//   }
// });

// // 2. Add New Story
// router.post("/", async (req, res) => {
//   try {
//     const db = getDb();
//     const storiesCollection = db.collection("stories");
//     const { name, avatar, cover, userEmail } = req.body;

//     const newStory = {
//       name,
//       avatar,
//       cover,
//       userEmail,
//       createdAt: new Date()
//     };

//     const result = await storiesCollection.insertOne(newStory);
//     res.status(201).json(result);
//   } catch (error) {
//     res.status(500).json({ message: "Failed to add story", error: error.message });
//   }
// });

// module.exports = router;