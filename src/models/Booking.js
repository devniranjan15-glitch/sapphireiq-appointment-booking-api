import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  slot: { type: mongoose.Schema.Types.ObjectId, ref: "Slot", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["booked", "cancelled"], default: "booked", index: true }
}, { timestamps: true });

// Database-level guard: a slot can have only one active booking.
bookingSchema.index(
  { slot: 1 },
  { unique: true, partialFilterExpression: { status: "booked" } }
);

export default mongoose.model("Booking", bookingSchema);
