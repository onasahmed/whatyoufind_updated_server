const express = require("express");
const { collections } = require("../config/db");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

const RESULT_LIMIT = 20;

// Escapes regex special characters so user input can't break the query
// or be used to build an expensive/malicious pattern.
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /search?q=graphic+design
// Looks across services, products, skills and posts and returns a single
// flat, ranked-by-collection list the frontend can render directly.
router.get(
  "/search",
  asyncHandler(async (req, res) => {
    const q = (req.query.q || "").trim();

    if (!q) {
      return res.send({ query: "", results: [] });
    }

    const pattern = new RegExp(escapeRegex(q), "i");

    const [services, products, skills, posts] = await Promise.all([
      collections
        .services()
        .find({ $or: [{ serviceName: pattern }, { serviceDescription: pattern }] })
        .sort({ _id: -1 })
        .limit(RESULT_LIMIT)
        .toArray(),
      collections
        .products()
        .find({ $or: [{ productName: pattern }, { productDescription: pattern }] })
        .sort({ _id: -1 })
        .limit(RESULT_LIMIT)
        .toArray(),
      collections
        .skills()
        .find({ skills: pattern })
        .sort({ _id: -1 })
        .limit(RESULT_LIMIT)
        .toArray(),
      collections
        .posts()
        .find({ description: pattern })
        .sort({ _id: -1 })
        .limit(RESULT_LIMIT)
        .toArray(),
    ]);

    const results = [
      ...services.map((s) => ({
        type: "service",
        id: s._id,
        title: s.serviceName,
        description: s.serviceDescription,
        image: s.servicePostImage,
        userName: s.userName,
        userEmail: s.userEmail,
      })),
      ...products.map((p) => ({
        type: "product",
        id: p._id,
        title: p.productName,
        description: p.productDescription,
        image: p.productImage,
        userName: p.userName,
        userEmail: p.userEmail,
      })),
      ...skills.map((sk) => ({
        type: "skill",
        id: sk._id,
        title: sk.skills,
        description: null,
        image: null,
        userName: sk.userName,
        userEmail: sk.userEmail,
      })),
      ...posts.map((p) => ({
        type: "post",
        id: p._id,
        title: p.userName || p.userEmail,
        description: p.description,
        image: p.postImage || null,
        userName: p.userName,
        userEmail: p.userEmail,
      })),
    ];

    res.send({ query: q, results });
  })
);

module.exports = router;
