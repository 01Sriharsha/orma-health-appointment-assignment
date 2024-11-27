import { NextRequest } from "next/server";
import moment from "moment";
import { apiResponse } from "@/util/api-response";
import DoctorModel, { DayEnum } from "@/models/doctor.model";
import { PipelineStage } from "mongoose";
import { connectToDatabase } from "@/lib/connectdb";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()
    const searchparams = req.nextUrl.searchParams;

    const speciality = searchparams.get("speciality");
    const longitude = searchparams.get("longitude");
    const latitude = searchparams.get("latitude");
    const maxDistance = searchparams.get("maxDistance");
    const availability = searchparams.get("availability");

    if (!longitude || !latitude) {
      return apiResponse(400, {
        message:
          "Longitude and latitude are required for filtering by distance.",
      });
    }
    if (!speciality) {
      return apiResponse(400, {
        message: "Speciality is required",
      });
    }

    const queryPipeline: PipelineStage[] = [];

    // Add geolocation filtering
    queryPipeline.push({
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        distanceField: "distance", // Calculated distance field
        maxDistance: maxDistance ? parseInt(maxDistance, 10) : 5000, // Default max distance is 5000 meters
        spherical: true,
        query: { specialty: new RegExp(speciality!, "i") }, //filter to specific speciality
      },
    });

    // Add availability filtering
    if (availability) {
      const today = moment();
      const dayOfWeek = today.isoWeekday();
      let daysToFilter: DayEnum[] = [];

      if (availability === "today") {
        daysToFilter = [Object.values(DayEnum)[dayOfWeek]];
      } else if (availability === "tomorrow") {
        daysToFilter = [Object.values(DayEnum)[(dayOfWeek + 1) % 7]];
      } else if (availability === "this_week") {
        daysToFilter = Object.values(DayEnum); // All days of the week
      }

      queryPipeline.push({
        $match: { "availability.day": { $in: daysToFilter } },
      });
    }

    // Execute the aggregation pipeline
    const doctors = await DoctorModel.aggregate(queryPipeline);

    return apiResponse(200, {
      message: "Filters applied",
      data: doctors,
    });
  } catch (error: any) {
    console.error("Error filtering doctors:", error);
    return apiResponse(500, { message: "Error filtering doctors" });
  }
}
