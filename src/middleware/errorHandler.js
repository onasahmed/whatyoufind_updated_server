// Express recognizes this as an error handler because it takes 4 args.
// Mount it last, after all routes.
const errorHandler = (err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).send({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;
