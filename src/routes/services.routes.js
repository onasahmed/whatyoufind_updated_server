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

// FIX: আগে এই route শুধু 'services' কালেকশনেই আপডেট খুঁজতো, কিন্তু বাস্তবে
// Homesubheader দিয়ে তৈরি হওয়া 'Service' পোস্টগুলো homePosts কালেকশনে জমা হয় —
// তাই এই route কার্যত কখনো কিছু আপডেট করতোই না (matchedCount সবসময় 0)।
// এখন homePosts/services/products তিনটাতেই খুঁজে, owner ভেরিফাই করে আপডেট করে।
router.put(
  '/updateService/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id
    const requesterEmail = req.headers['user-email']

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ success: false, message: 'Invalid ID format' })
    }
    if (!requesterEmail) {
      return res.status(401).send({ success: false, message: 'Missing user-email header — cannot verify ownership' })
    }

    const objectId = new ObjectId(id)
    const emailRegex = new RegExp(`^${requesterEmail.trim()}$`, 'i')

    const collectionsToCheck = [
      collections.homePosts(),
      collections.services(),
      collections.products(),
    ]

    for (const col of collectionsToCheck) {
      const doc = await col.findOne({ _id: objectId })
      if (!doc) continue

      const ownerEmail = doc.userEmail || doc.email
      if (!ownerEmail || !emailRegex.test(ownerEmail)) {
        return res.status(403).send({ success: false, message: "You are not allowed to edit someone else's post/service" })
      }

      const updatedFields = {}
      if (req.body.serviceName) {
        updatedFields.serviceName = req.body.serviceName
        // homePosts-এ তৈরি হওয়া service item title/details ফিল্ডে থাকে —
        // সেগুলোও আপডেট রাখা হচ্ছে যাতে ফিড/ড্যাশবোর্ড দুই জায়গাতেই নতুন নাম দেখায়
        updatedFields.title = req.body.serviceName
        updatedFields['formData.servicename'] = req.body.serviceName
      }
      if (req.body.serviceDescription) {
        updatedFields.serviceDescription = req.body.serviceDescription
        updatedFields.details = req.body.serviceDescription
      }

      const result = await col.updateOne({ _id: objectId }, { $set: updatedFields })
      return res.send({ success: true, ...result })
    }

    return res.status(404).send({ success: false, message: 'Item not found' })
  })
)

// 🔴 NOTE: DELETE /deleteService/:id এখানে আগে আলাদা করে define করা ছিল,
// কিন্তু index.js-এ postsRoutes এর আগে mount হওয়ায় সেই route কখনো চলতোই না —
// posts.routes.js এর deleteHandler-ই আসলে এই path handle করে (ownership check + 
// homePosts/services/products তিনটা কালেকশন চেক করে)। তাই এখান থেকে বাদ দেওয়া হলো
// duplicate/dead route hisebe confusion এড়াতে।

module.exports = router
