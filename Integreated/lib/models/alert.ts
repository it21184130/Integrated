import mongoose, { Schema, Document } from "mongoose";

export interface IAlert extends Document {
  type: "fraud" | "dos";
  timestamp: Date;
  details: object;
  resolved: boolean;
}

const AlertSchema: Schema = new Schema({
  type: {
    type: String,
    enum: ["fraud", "dos"],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  details: {
    type: Schema.Types.Mixed,
    required: true,
  },
  resolved: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.models.Alert ||
  mongoose.model<IAlert>("Alert", AlertSchema);
