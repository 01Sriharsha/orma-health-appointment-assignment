import { Metadata } from "next";
import SearchDoctorForm from "./search-doctor-form";

export const metadata: Metadata = {
  title: "Search",
  description: "Doctors search page",
};

export default async function SearchPage() {
  return (
    <div className="h-screen grid place-items-center">
      <SearchDoctorForm />
    </div>
  );
}
