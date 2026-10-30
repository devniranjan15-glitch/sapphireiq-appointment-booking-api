import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const port = process.env.PORT || 5000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET must be set and at least 32 characters long.");
  process.exit(1);
}

try {
  await connectDB();
  app.listen(port, () => console.log(`SapphireIQ API listening on port ${port}`));
} catch (err) {
  console.error("Could not start server:", err.message);
  process.exit(1);
}
