"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { MapPin, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchLocations } from "@/util/fetch-location";

const formSchema = z.object({
  location: z.string().min(2, {
    message: "Location must be at least 2 characters.",
  }),
  specialty: z.string().min(1, {
    message: "Please select a specialty.",
  }),
});

export default function SearchDoctorForm() {
  const [isLocating, setIsLocating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [coordinates, setCoordinates] = useState({ latitude: 0, longitude: 0 });

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: "",
      specialty: "",
    },
  });

  const { data: locations, isFetching } = useQuery({
    queryKey: ["locations", searchTerm],
    queryFn: () => fetchLocations(searchTerm),
    enabled: searchTerm.length >= 3,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.getValues("location").length >= 3) {
        setSearchTerm(form.getValues("location"));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [form.getValues("location")]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (coordinates.latitude === 0 || coordinates.longitude === 0) return;
    const query = `/doctors?speciality=${
      values.specialty
    }&location=${form.getValues("location")}&lat=${coordinates.latitude}&lon=${
      coordinates.longitude
    }`;
    return router.push(query);
  }

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          form.setValue("location", `${latitude}, ${longitude}`);
          setCoordinates({ latitude, longitude });
          setIsLocating(false);
          toast.message("Location found", {
            description: "Your current location has been set.",
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLocating(false);
          toast.error("Failed to get your location. Please enter it manually.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Find Your Doctor</h1>
        <p className="text-muted-foreground">
          Book appointments with trusted healthcare providers
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Enter location"
                        className="pl-9"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setSearchTerm(e.target.value);
                        }}
                      />
                      {isFetching && (
                        <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                  {locations && locations.length > 0 && (
                    <ul className="mt-2 max-h-60 overflow-auto rounded-md border bg-white p-2 shadow-sm">
                      {locations.map((location, index) => (
                        <li
                          key={index}
                          className="cursor-pointer p-2 hover:bg-gray-100"
                          onClick={() => {
                            form.setValue("location", location.display_name);
                            setCoordinates({
                              latitude: +location.lat,
                              longitude: +location.lon,
                            });
                            setSearchTerm("");
                          }}
                        >
                          {location.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </FormItem>
              )}
            />

            <Button
              type="button"
              variant="outline"
              onClick={getCurrentLocation}
              disabled={isLocating}
              className="w-full"
            >
              {isLocating ? "Locating..." : "Use Current Location"}
            </Button>

            <FormField
              control={form.control}
              name="specialty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialty</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select specialty" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pediatrician">Pediatrician</SelectItem>
                      <SelectItem value="dentist">Dentist</SelectItem>
                      <SelectItem value="cardiologist">Cardiologist</SelectItem>
                      <SelectItem value="general">General Practice</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-[#FCD34D] hover:bg-[#F6C429] text-black"
            >
              Search Doctors
            </Button>
          </form>
        </Form>
      </div>

      <div className="mt-8">
        <h2 className="text-center mb-4 font-medium">
          Popular Specializations
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          {["General Practice", "Dentistry", "Pediatrics", "Cardiology"].map(
            (specialty) => (
              <Button
                key={specialty}
                variant="outline"
                className="rounded-full"
                onClick={() =>
                  form.setValue("specialty", specialty.toLowerCase())
                }
              >
                {specialty}
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
