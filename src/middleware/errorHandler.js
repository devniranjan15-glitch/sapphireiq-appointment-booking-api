export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err?.name === "ZodError") {
    return res.status(400).json({
      message: "Request validation failed.",
      errors: err.issues.map(issue => ({ field: issue.path.join("."), message: issue.message }))
    });
  }
  if (err?.name === "ValidationError" || err?.name === "CastError") {
    return res.status(400).json({ message: err.message });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ message: "A conflicting record already exists." });
  }

  console.error(err);
  res.status(err.status || 500).json({
    message: err.status ? err.message : "Internal server error."
  });
}
