import { Router } from "express";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Slot from "../models/Slot.js";
import { authenticate, allowRoles } from "../middleware/auth.js";

const router = Router();

router.post("/", authenticate, allowRoles("user"), async (req, res, next) => {
  try {
    const { slotId } = req.body || {};
    if (!slotId || !mongoose.isValidObjectId(slotId)) {
      return res.status(400).json({ message: "A valid slotId is required." });
    }

    // Atomic conditional update: only one concurrent request can claim this slot.
    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, isBooked: false, startAt: { $gt: new Date() } },
      { $set: { isBooked: true } },
      { new: true }
    );
    if (!slot) {
      return res.status(409).json({ message: "This slot is unavailable, already booked, or in the past." });
    }

    try {
      const booking = await Booking.create({
        slot: slot._id,
        user: req.user._id,
        provider: slot.provider,
        status: "booked"
      });
      const populated = await Booking.findById(booking._id)
        .populate("slot")
        .populate("user", "name email")
        .populate("provider", "name email");
      return res.status(201).json({ message: "Appointment booked.", booking: populated });
    } catch (err) {
      // Restore availability if creating the booking fails.
      await Slot.updateOne({ _id: slot._id }, { $set: { isBooked: false } });
      throw err;
    }
  } catch (err) { next(err); }
});

router.get("/mine", authenticate, async (req, res, next) => {
  try {
    const filter = req.user.role === "provider"
      ? { provider: req.user._id }
      : { user: req.user._id };
    const bookings = await Booking.find(filter)
      .populate("slot")
      .populate("user", "name email")
      .populate("provider", "name email")
      .sort({ createdAt: -1 });
    res.json({ count: bookings.length, bookings });
  } catch (err) { next(err); }
});

router.patch("/:id/cancel", authenticate, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid booking id." });
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    const allowed = booking.user.toString() === req.user._id.toString() ||
      (req.user.role === "provider" && booking.provider.toString() === req.user._id.toString());
    if (!allowed) return res.status(403).json({ message: "You cannot cancel this booking." });
    if (booking.status === "cancelled") {
      return res.status(409).json({ message: "This booking is already cancelled." });
    }

    // Conditional update prevents two cancellation requests from both succeeding.
    const cancelled = await Booking.findOneAndUpdate(
      { _id: booking._id, status: "booked" },
      { $set: { status: "cancelled" } },
      { new: true }
    );
    if (!cancelled) return res.status(409).json({ message: "This booking is already cancelled." });
    await Slot.updateOne({ _id: booking.slot, isBooked: true }, { $set: { isBooked: false } });
    res.json({ message: "Booking cancelled. The slot is available again.", booking: cancelled });
  } catch (err) { next(err); }
});

export default router;
