import { Router } from "express";
import Slot from "../models/Slot.js";
import { authenticate, allowRoles } from "../middleware/auth.js";
import { slotSchema } from "../utils/validation.js";

const router = Router();

// Public: list future unbooked slots. Optional providerId query parameter.
router.get("/", async (req, res, next) => {
  try {
    const filter = { isBooked: false, startAt: { $gt: new Date() } };
    if (req.query.providerId) filter.provider = req.query.providerId;
    const slots = await Slot.find(filter).populate("provider", "name").sort({ startAt: 1 });
    res.json({ count: slots.length, slots });
  } catch (err) { next(err); }
});

router.post("/", authenticate, allowRoles("provider"), async (req, res, next) => {
  try {
    const data = slotSchema.parse(req.body);
    const startAt = new Date(data.startAt);
    const endAt = new Date(data.endAt);
    if (startAt <= new Date()) return res.status(400).json({ message: "Slots must start in the future." });
    const slot = await Slot.create({ provider: req.user._id, startAt, endAt });
    res.status(201).json({ message: "Slot created.", slot });
  } catch (err) { next(err); }
});

router.get("/mine", authenticate, allowRoles("provider"), async (req, res, next) => {
  try {
    const slots = await Slot.find({ provider: req.user._id }).sort({ startAt: 1 });
    res.json({ count: slots.length, slots });
  } catch (err) { next(err); }
});

export default router;
