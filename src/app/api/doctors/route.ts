import { NextRequest } from "next/server";
import { ApiError, apiResponse } from "@/util/api-response";
import DoctorModel from "@/models/doctor.model";
import { connectToDatabase } from "@/lib/connectdb";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()
    const body = await req.json();
    const doctorModel = new DoctorModel(body);
    const savedDoctor = await doctorModel.save();
    if (!savedDoctor) throw new ApiError(500, "Failed to add doctor details");

    return apiResponse(200, {
      message: "Doctor details added successfully!",
      data: savedDoctor,
    });
  } catch (error: any) {
    return apiResponse(error.status, { message: error.message });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()
    const doctors = await DoctorModel.find();
    return apiResponse(200, {
      message: "Doctor fetched successfully!",
      data: doctors,
    });
  } catch (error: any) {
    return apiResponse(error.status, { message: error.message });
  }
}
