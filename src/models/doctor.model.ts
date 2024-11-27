import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDoctor extends Document {
  name: string;
  specialty: string;
  location: string;
  coordinates: { type: "Point"; coordinates: [number, number] }; // GeoJSON for 2dsphere indexing
  distance: number;
  currentQueue: number;
  estimatedWait: number;
  availableTime: Date;
  availability: { day: DayEnum; start: string; end: string }[]; // Weekly availability
}

// Enum for days of the week
export enum DayEnum {
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday",
  Saturday = "Saturday",
  Sunday = "Sunday",
}

const DoctorSchema: Schema = new Schema({
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  location: { type: String, required: true },
  coordinates: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  distance: { type: Number, required: true },
  currentQueue: { type: Number, required: true, default: 0 },
  estimatedWait: { type: Number, required: true, default: 0 },
  availableTime: { type: Date, required: true },
  availability: [
    {
      day: { type: String, enum: Object.values(DayEnum), required: true },
      start: { type: String, required: true },
      end: { type: String, required: true },
    },
  ],
});

// Enable 2dsphere indexing for geo queries
DoctorSchema.index({ coordinates: "2dsphere" });

const DoctorModel: Model<IDoctor> =
  mongoose.models.Doctor || mongoose.model<IDoctor>("Doctor", DoctorSchema);

export default DoctorModel;
