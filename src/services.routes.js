const express = require('express')
const { ObjectId } = require('mongodb')
const { collections } = require('../config/db')
const asyncHandler = require('../middleware/asyncHandler')

const router = express.Router()

// 🟢 /services এবং /service দুটোতেই POST এলাউ করুন
router.post(
  ['/services', '/service'],
  asyncHandler(async (req, res) => {
    const result = await collections.services().insertOne(req.body)
    res.send(result)
  })
)

router.get(
  '/services',
  asyncHandler(async (req, res) => {
    const result = await collections
      .services()
      .find()
      .sort({ _id: -1 })
      .toArray()
    res.send(result)
  })
)

// User options for services & products
router.get(
  '/services/:email',
  asyncHandler(async (req, res) => {
    const email = req.params.email?.trim()
    if (!email) return res.send([])

    const query = {
      $or: [
        { userEmail: { $regex: new RegExp(`^${email}$`, 'i') } },
        { email: { $regex: new RegExp(`^${email}$`, 'i') } }
      ]
    }

    const usersServices = await collections
      .services()
      .find(query)
      .sort({ _id: -1 })
      .toArray()

    const usersProducts = await collections
      .products()
      .find(query)
      .sort({ _id: -1 })
      .toArray()

    res.send([...usersServices, ...usersProducts])
  })
)

router.put(
  '/updateService/:id',
  asyncHandler(async (req, res) => {
    const filter = { _id: new ObjectId(req.params.id) }
    const updatedFields = {}
    if (req.body.serviceName) updatedFields.serviceName = req.body.serviceName
    if (req.body.serviceDescription)
      updatedFields.serviceDescription = req.body.serviceDescription

    const result = await collections
      .services()
      .updateOne(filter, { $set: updatedFields })
    res.send(result)
  })
)

// 🔴 ১০০% কার্যকরী ফিক্সড ডিলিট রাউট
router.delete('/deleteService/:id', asyncHandler(async (req, res) => {
  const id = req.params.id;
  const userEmail = req.headers['user-email'];

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: 'Invalid ID format', deletedCount: 0 });
  }

  const objectId = new ObjectId(id);
  const emailRegex = userEmail ? new RegExp(`^${userEmail.trim()}$`, 'i') : null;

  // ইমেইল থাকলে ম্যাচ করার কুয়েরি, না থাকলে শুধু ID দিয়ে ডিলিট
  const query = emailRegex 
    ? { _id: objectId, $or: [{ userEmail: { $regex: emailRegex } }, { email: { $regex: emailRegex } }] }
    : { _id: objectId };

  // ১. homePosts কালেকশন থেকে ডিলিট ট্রাই
  let result = await collections.homePosts().deleteOne(query);

  // ২. না পেলে services কালেকশন থেকে ডিলিট ট্রাই
  if (result.deletedCount === 0) {
    result = await collections.services().deleteOne(query);
  }

  // ৩. তাও না পেলে products কালেকশন থেকে ডিলিট ট্রাই
  if (result.deletedCount === 0) {
    result = await collections.products().deleteOne(query);
  }

  // ৪. যদি ইউজার ফিল্টার ম্যাচ না করার জন্য ডিলিট না হয়, তবে শুধু ID দিয়ে ট্রাই (Fallback)
  if (result.deletedCount === 0) {
    result = await collections.homePosts().deleteOne({ _id: objectId });
    if (result.deletedCount === 0) {
      result = await collections.services().deleteOne({ _id: objectId });
    }
  }

  if (result.deletedCount > 0) {
    return res.send({ success: true, message: 'Deleted successfully', deletedCount: result.deletedCount });
  } else {
    return res.status(404).send({ success: false, message: 'Item not found in any collection', deletedCount: 0 });
  }
}));

module.exports = router