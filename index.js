const express = require("express");
const cors = require("cors");
require("dotenv").config();

const ensureDb = require("./src/middleware/ensureDb");
const errorHandler = require("./src/middleware/errorHandler");

const usersRoutes = require("./src/routes/users.routes");
const postsRoutes = require("./src/routes/posts.routes");
const servicesRoutes = require("./src/routes/services.routes");
const productsRoutes = require("./src/routes/products.routes");
const educationRoutes = require("./src/routes/education.routes");
const skillsRoutes = require("./src/routes/skills.routes");
const experienceRoutes = require("./src/routes/experience.routes");
const recordsRoutes = require("./src/routes/records.routes");
const interestsRoutes = require("./src/routes/interests.routes");
const aboutRoutes = require("./src/routes/about.routes");
const searchRoutes = require("./src/routes/search.routes");
const messagesRoutes = require("./src/routes/messages.routes");
const reviewsRoutes = require("./src/routes/reviews.routes");
// const storiesRoutes = require("./src/routes/stories.routes");
const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://whatyoufind-updated-server.vercel.app",
  "https://whatyoufind.netlify.app" // <-- সঠিক ডোমেইন (হাইফেন ছাড়া)
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("WhatUFind API is running");
});

// Ensures the MongoDB connection is ready before any /users, /posts, etc.
// route runs. Routes are still registered synchronously below, so there's
// no race condition on a serverless cold start.
app.use(ensureDb);

app.use(usersRoutes);
app.use(postsRoutes);
app.use(servicesRoutes);
app.use(productsRoutes);
app.use(educationRoutes);
app.use(skillsRoutes);
app.use(experienceRoutes);
app.use(recordsRoutes);
app.use(interestsRoutes);
app.use(aboutRoutes);
app.use(searchRoutes);
app.use(messagesRoutes);
app.use(reviewsRoutes);
// app.use("/stories", storiesRoutes);
// 404 for anything that didn't match a route above
app.use((req, res) => {
  res.status(404).send({ success: false, message: "Route not found" });
});

// Must be registered last
app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`WhatUFind server listening on port ${port}`);
});

module.exports = app;
