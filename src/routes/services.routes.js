const express = require("express");
const { ObjectId } = require("mongodb");
const { collections } = require("../config/db");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

router.post(
  "/service",
  asyncHandler(async (req, res) => {
    const result = await collections.services().insertOne(req.body);
    res.send(result);
  })
);

router.get(
  "/services",
  asyncHandler(async (req, res) => {
    const result = await collections.services().find().sort({ _id: -1 }).toArray();
    res.send(result);
  })
);

// Kept exactly as the original: this endpoint returns a user's services AND
// products combined, since the dashboard shows them in one grid.
router.get(
  "/services/:email",
  asyncHandler(async (req, res) => {
    const email = req.params.email;
    const usersServices = await collections
      .services()
      .find({ userEmail: email })
      .sort({ _id: -1 })
      .toArray();
    const usersProducts = await collections
      .products()
      .find({ userEmail: email })
      .sort({ _id: -1 })
      .toArray();
    res.send([...usersServices, ...usersProducts]);
  })
);

router.put(
  "/updateService/:id",
  asyncHandler(async (req, res) => {
    const filter = { _id: new ObjectId(req.params.id) };
    const updatedFields = {};
    if (req.body.serviceName) updatedFields.serviceName = req.body.serviceName;
    if (req.body.serviceDescription) updatedFields.serviceDescription = req.body.serviceDescription;

    const result = await collections.services().updateOne(filter, { $set: updatedFields });
    res.send(result);
  })
);

router.delete(
  "/deleteService/:id",
  asyncHandler(async (req, res) => {
    const result = await collections.services().deleteOne({ _id: new ObjectId(req.params.id) });
    res.send(result);
  })
);

module.exports = router;
