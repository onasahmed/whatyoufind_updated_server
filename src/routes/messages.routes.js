const express = require("express");
const { collections } = require("../config/db");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

// দুইজন user-এর মধ্যেকার চ্যাট থ্রেড সবসময় একই "conversationId"-তে জমা হয়,
// email দুটোকে sort করে জোড়া দিয়ে — কে আগে message দিলো সেটা কোনো ফ্যাক্টর না
const conversationKey = (a, b) =>
  [a.toLowerCase().trim(), b.toLowerCase().trim()].sort().join("__");

// 🟢 ১. মেসেজ পাঠানো
router.post(
  "/messages",
  asyncHandler(async (req, res) => {
    const { senderEmail, receiverEmail, text } = req.body;

    if (!senderEmail || !receiverEmail || !text?.trim()) {
      return res.status(400).send({
        success: false,
        message: "senderEmail, receiverEmail and text are required",
      });
    }

    const message = {
      conversationId: conversationKey(senderEmail, receiverEmail),
      senderEmail: senderEmail.toLowerCase().trim(),
      receiverEmail: receiverEmail.toLowerCase().trim(),
      text: text.trim(),
      createdAt: new Date(),
    };

    const result = await collections.messages().insertOne(message);
    res.status(201).send({ success: true, message: { ...message, _id: result.insertedId } });
  })
);

// 🔵 ২. দুইজনের মধ্যেকার পুরো কথোপকথন (থ্রেড) আনা
router.get(
  "/messages/:userEmail/:otherEmail",
  asyncHandler(async (req, res) => {
    const { userEmail, otherEmail } = req.params;
    const convId = conversationKey(userEmail, otherEmail);

    const thread = await collections
      .messages()
      .find({ conversationId: convId })
      .sort({ createdAt: 1 })
      .toArray();

    res.send(thread);
  })
);

// 🟡 ৩. একজন ইউজারের সব কথোপকথনের লিস্ট (ইনবক্স) — প্রতিটা কনভারসেশনের সর্বশেষ মেসেজসহ
router.get(
  "/conversations/:userEmail",
  asyncHandler(async (req, res) => {
    const userEmail = req.params.userEmail.toLowerCase().trim();

    const allMessages = await collections
      .messages()
      .find({ $or: [{ senderEmail: userEmail }, { receiverEmail: userEmail }] })
      .sort({ createdAt: -1 })
      .toArray();

    const seen = new Map();
    for (const msg of allMessages) {
      const otherEmail = msg.senderEmail === userEmail ? msg.receiverEmail : msg.senderEmail;
      if (!seen.has(otherEmail)) {
        seen.set(otherEmail, {
          withEmail: otherEmail,
          lastMessage: msg.text,
          lastMessageAt: msg.createdAt,
        });
      }
    }

    res.send(Array.from(seen.values()));
  })
);

module.exports = router;
