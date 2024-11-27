import { NextRequest } from "next/server";
import moment from "moment";
import AppointmentModel from "@/models/appointment.model";
import DoctorModel from "@/models/doctor.model";
import { apiResponse } from "@/util/api-response";
import { validateTimeslot } from "@/util/validate-timeslot";
import { connectToDatabase } from "@/lib/connectdb";

const MAX_PATIENTS_PER_SLOT = 5;

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    // Extract appointment details from the request body
    const { doctorId, patientName, patientContact, appointmentDate, timeSlot } =
      await req.json();

    // Validate the required fields
    if (
      !doctorId ||
      !patientName ||
      !patientContact ||
      !appointmentDate ||
      !timeSlot
    ) {
      return apiResponse(400, { message: "Missing required fields" });
    }

    //validate time slot
    if (validateTimeslot(timeSlot, appointmentDate)) {
      return apiResponse(400, {
        message: "Appointment time cannot be in the past",
      });
    }

    // Check if the doctor exists
    const doctor = await DoctorModel.findById(doctorId);
    if (!doctor) {
      return apiResponse(404, { message: "Doctor not found" });
    }

    // Check if the selected time slot is already filled
    const existingAppointments = await AppointmentModel.find({
      doctor: doctorId,
      appointmentDate: {
        $gte: moment(appointmentDate).startOf("day").toDate(),
        $lt: moment(appointmentDate).endOf("day").toDate(),
      },
      timeSlot: timeSlot,
    });

    if (existingAppointments.length >= MAX_PATIENTS_PER_SLOT) {
      return apiResponse(400, { message: "This time slot is already full" });
    }

    // Create the new appointment
    const newAppointment = new AppointmentModel({
      doctor: doctorId,
      patientName,
      patientContact,
      appointmentDate: moment(appointmentDate).toDate(),
      timeSlot,
    });

    const updated = await DoctorModel.updateOne(
      { _id: doctorId },
      {
        currentQueue: doctor.currentQueue + 1,
      }
    );

    if (!updated) console.error("Failed to updated current queue");

    await newAppointment.save();

    return apiResponse(201, {
      message: "Appointment created successfully",
      data: newAppointment,
    });
  } catch (error: any) {
    console.error("Error saving appointment:", error);
    return apiResponse(500, { message: "Error saving appointment" });
  }
}
