const { ObjectId } = require("mongodb");

// 🟢 প্রোফাইল সেকশনগুলো (about/skills/education/experience/interest/record) যাতে
// শুধুমাত্র সেই user-ই যোগ/এডিট/ডিলিট করতে পারে যার প্রোফাইল, অন্য কেউ না — সেজন্য এই
// generic ownership middleware। ফ্রন্টএন্ড থেকে প্রতিটা রিকোয়েস্টে `user-email` header
// পাঠাতে হবে, সেটা owner-এর email-এর সাথে না মিললে 403 রিটার্ন হবে।

// POST/create: body.userEmail === header
const requireOwnerOnCreate = () => (req, res, next) => {
  const requesterEmail = (req.headers["user-email"] || "").trim().toLowerCase();
  const ownerEmail = (req.body.userEmail || "").trim().toLowerCase();
  if (!requesterEmail || !ownerEmail || requesterEmail !== ownerEmail) {
    return res.status(403).send({ success: false, message: "You can only edit your own profile." });
  }
  next();
};

// PUT/DELETE on an existing doc: existing doc's userEmail === header
const requireOwnerOnExisting = (getCollection) => async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).send({ success: false, message: "Invalid id" });
    }
    const requesterEmail = (req.headers["user-email"] || "").trim().toLowerCase();
    const doc = await getCollection().findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return res.status(404).send({ success: false, message: "Not found" });
    const ownerEmail = (doc.userEmail || "").trim().toLowerCase();
    if (!requesterEmail || requesterEmail !== ownerEmail) {
      return res.status(403).send({ success: false, message: "You can only edit your own profile." });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireOwnerOnCreate, requireOwnerOnExisting };
