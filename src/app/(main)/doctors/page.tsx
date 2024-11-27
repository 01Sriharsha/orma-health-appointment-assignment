import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";

import { ArrowLeft, Clock, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Filters from "./filters";
import { ApiResponse } from "@/util/api-response";
import moment from "moment";
import { IDoctor } from "@/models/doctor.model";
import AppointmentDialog from "./appointment-dialog";

export const metadata: Metadata = {
  title: "Find Doctors",
  description: "List all doctors page",
};

type ListDoctorsPageParams = {
  searchParams: Promise<{
    speciality: string;
    location: string;
    lat: string;
    lon: string;
    maxDistance?: string;
    availability?: string;
  }>;
};

const getDoctorsByFilters = async (
  speciality: string,
  lon: number,
  lat: number,
  maxDistance = 20000,
  availability = "today"
) => {
  try {
    const res = await fetch(
      `${process.env
        .NEXT_PUBLIC_SERVER_URL!}/api/doctors/filter?speciality=${speciality}&longitude=${lon}&latitude=${lat}&maxDistance=${maxDistance}&availability=${availability}`,
      { method: "GET" }
    );
    if (!res.ok) throw new Error();
    const response: ApiResponse = await res.json();
    return response.data;
  } catch (error: any) {
    return [];
  }
};

export default async function ListDoctorsPage({
  searchParams,
}: ListDoctorsPageParams) {
  const searchparams = await searchParams;

  const { speciality, lon, lat, location, maxDistance, availability } =
    searchparams;

  if (!speciality || !lon || !lat || !location) {
    return redirect("/search");
  }

  const doctors: IDoctor[] = await getDoctorsByFilters(
    speciality,
    +lon,
    +lat,
    +maxDistance! || 20000,
    availability || ""
  );

  const displayAvailability = (availability: IDoctor["availability"]) => {
    const availableDays = availability.map((slot) => slot.day);

    const today = moment().format("dddd"); //Monday
    const availableToday = availableDays.some((day) => day === today);
    if (availableToday) return "Available Today";

    const tomorrow = moment().add(1, "day").format("dddd"); //+1 -> Tuesday
    const availableTomorrow = availableDays.some((day) => day === tomorrow);
    if (availableTomorrow) return "Available Tomorrow";

    return availableDays[0];
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)} meters`;
    } else {
      return `${(distance / 1000).toFixed(1)} km`;
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="flex items-center justify-between mb-6">
        <Link
          href="/search"
          className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Search
        </Link>
        <Filters {...searchparams} />
      </header>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Doctors near {location || "Current Location"}
        </h1>
        <p className="text-sm text-gray-500">{doctors.length} doctors found</p>
      </div>

      <div className="space-y-4">
        {doctors.map((doctor, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <div>
                    <h2 className="text-lg font-semibold">{doctor.name}</h2>
                    <p className="text-sm text-gray-500">{doctor.specialty}</p>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="mr-2 h-4 w-4" />
                    {doctor.location} ({formatDistance(doctor.distance)} away)
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="mr-2 h-4 w-4" />
                    Current queue: {doctor.currentQueue} patients
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="mr-2 h-4 w-4" />
                    Estimated wait: {doctor.estimatedWait} min
                  </div>
                </div>
                <div className="text-right">
                  <div className="mb-2">
                    <div className="text-sm text-gray-500">
                      {displayAvailability(doctor.availability)}
                    </div>
                    {/* <div className="font-semibold">{doctor.availableTime}</div> */}
                  </div>
                  <AppointmentDialog doctorId={doctor._id as string} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
