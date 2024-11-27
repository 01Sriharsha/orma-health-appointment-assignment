import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAppointment extends Document {
  doctor: mongoose.Types.ObjectId; // Reference to Doctor model
  patientName: string;
  patientContact: string;
  appointmentDate: Date;
  timeSlot: string; // e.g., "10:00-11:00"
}

const AppointmentSchema: Schema = new Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
  patientName: { type: String, required: true },
  patientContact: { type: String, required: true },
  appointmentDate: { type: Date, required: true },
  timeSlot: { type: String, required: true },
});

const AppointmentModel: Model<IAppointment> =
  mongoose.models.Appointment ||
  mongoose.model<IAppointment>("Appointment", AppointmentSchema);

export default AppointmentModel;
