import mongoose from "mongoose";

const slotSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  isBooked: { type: Boolean, default: false, index: true }
}, { timestamps: true });

slotSchema.index({ provider: 1, startAt: 1 }, { unique: true });

slotSchema.pre("validate", function (next) {
  if (this.startAt && this.endAt && this.endAt <= this.startAt) {
    this.invalidate("endAt", "endAt must be later than startAt");
  }
  next();
});

export default mongoose.model("Slot", slotSchema);
