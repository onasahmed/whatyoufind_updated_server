const { MongoClient, ServerApiVersion } = require("mongodb");

const user = process.env.USER_NAME;
const pass = process.env.USER_PASS;

if (!user || !pass) {
  console.warn(
    "[db] USER_NAME / USER_PASS are not set — check your .env file."
  );
}

const uri = `mongodb+srv://${user}:${pass}@cluster0.j55wfnv.mongodb.net/whatufind_test?retryWrites=true&w=majority`;

// Global scope-এ client বজায় রাখা হচ্ছে যেন Vercel function রিউজ হতে পারে
let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    connectTimeoutMS: 10000, // ১০ সেকেন্ডের মধ্যে কানেক্ট করার ট্রাই করবে
  });
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

async function connect() {
  await clientPromise;
  console.log("[db] Connected to MongoDB");
  return client;
}

function db() {
  return client.db("whatufind_test");
}

const collections = {
  users: () => db().collection("users"),
  posts: () => db().collection("posts"),
  homePosts: () => db().collection("home-posts"),
  services: () => db().collection("service-post"),
  products: () => db().collection("product-post"),
  eduInfo: () => db().collection("education-info"),
  skills: () => db().collection("skills"),
  experience: () => db().collection("experience"),
  records: () => db().collection("record"),
  interests: () => db().collection("interest"),
  about: () => db().collection("about"),
  messages: () => db().collection("messages"),
  reviews: () => db().collection("reviews"),
};

module.exports = { connect, db, collections, client };