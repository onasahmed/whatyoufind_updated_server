const { MongoClient, ServerApiVersion } = require("mongodb");

const user = process.env.USER_NAME;
const pass = process.env.USER_PASS;

if (!user || !pass) {
  console.warn(
    "[db] USER_NAME / USER_PASS are not set — check your .env file (see .env.example)."
  );
}

const uri = `mongodb+srv://${user}:${pass}@whatufind-cluster.2omxzv7.mongodb.net/?retryWrites=true&w=majority&appName=whatufind-cluster`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Cache the connection promise so serverless invocations (Vercel) reuse
// the same connection instead of opening a new one per request.
let connectionPromise = null;

function connect() {
  if (!connectionPromise) {
    connectionPromise = client.connect().then(() => {
      console.log("[db] Connected to MongoDB");
      return client;
    });
  }
  return connectionPromise;
}

function db() {
  return client.db("whatufind");
}

// Collection getters — same collection names as the original index.js,
// exposed as a single object so controllers can destructure what they need.
const collections = {
  users: () => db().collection("users"),
  posts: () => db().collection("posts"),
  services: () => db().collection("service-post"),
  products: () => db().collection("product-post"),
  eduInfo: () => db().collection("education-info"),
  skills: () => db().collection("skills"),
  experience: () => db().collection("experience"),
  records: () => db().collection("record"),
  interests: () => db().collection("interest"),
  about: () => db().collection("about"),
};

module.exports = { connect, db, collections, client };
