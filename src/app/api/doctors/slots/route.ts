import { NextRequest } from "next/server";
import moment from "moment";
import DoctorModel from "@/models/doctor.model";
import AppointmentModel from "@/models/appointment.model";
import { apiResponse } from "@/util/api-response";
import { connectToDatabase } from "@/lib/connectdb";

const MAX_PATIENTS_PER_SLOT = 5;

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const searchParams = req.nextUrl.searchParams;
    const doctorId = searchParams.get("doctorId");
    const selectedDay = searchParams.get("day"); // e.g., "Monday"

    if (!doctorId) {
      return apiResponse(400, { message: "Doctor ID is required" });
    }
    if (!selectedDay) {
      return apiResponse(400, { message: "select a Day" });
    }

    const doctor = await DoctorModel.findById(doctorId);
    console.log("doctor", doctor);

    if (doctor === null) {
      return apiResponse(404, { message: "Doctor not found" });
    }

    // Get availability for the selected day
    const availability = doctor?.availability.find(
      (a) => a.day === selectedDay
    );

    if (!availability) {
      return apiResponse(404, {
        message: `No availability found for ${selectedDay}`,
      });
    }

    // Generate time slots based on the doctor's availability
    const slots: { time: string; isFull: boolean }[] = [];
    let startTime = moment(availability.start, "HH:mm");
    const endTime = moment(availability.end, "HH:mm");

    while (startTime.isBefore(endTime)) {
      const nextTime = startTime.clone().add(1, "hour"); //+1 hr
      const timeSlot = `${startTime.format("hh:mm A")}-${nextTime.format(
        "hh:mm A"
      )}`;
      slots.push({ time: timeSlot, isFull: false });
      startTime = nextTime;
    }

    // Fetch existing appointments for this doctor and day
    const appointments = await AppointmentModel.find({
      doctor: doctorId,
      appointmentDate: {
        $gte: moment().startOf("day").toDate(),
        $lt: moment().endOf("day").toDate(),
      },
    });

    // Mark slots as full if they exceed max patients
    const slotCounts: Record<string, number> = {};
    appointments.forEach((appointment) => {
      const slot = appointment.timeSlot;
      slotCounts[slot] = (slotCounts[slot] || 0) + 1;
    });

    slots.forEach((slot) => {
      if ((slotCounts[slot.time] || 0) >= MAX_PATIENTS_PER_SLOT) {
        slot.isFull = true;
      }
    });

    return apiResponse(200, {
      message: "Time slots retrieved successfully",
      data: slots,
    });
  } catch (error: any) {
    console.error("Error fetching time slots:", error);
    return apiResponse(500, {
      message: "Error fetching time slots",
    });
  }
}
