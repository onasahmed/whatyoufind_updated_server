const { connect } = require("../config/db");

// Registered once, before all routes. Awaits the (cached) DB connection so
// route handlers never have to think about connecting — and so routes can
// be attached synchronously at startup without a race condition on
// serverless cold starts.
const ensureDb = async (req, res, next) => {
  try {
    await connect();
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = ensureDb;
