"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { ChevronDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useRouter } from "next/navigation";

type FilterProps = {
  speciality: string;
  location: string;
  lat: string;
  lon: string;
};

export default function Filters({
  speciality,
  location,
  lon,
  lat,
}: FilterProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm({
    defaultValues: {
      distance: "",
      availability: "",
    },
  });

  const onSubmit = (values: { distance: string; availability: string }) => {
    let query = `/doctors?speciality=${speciality}&location=${location}&lat=${lat}&lon=${lon}`;
    if (values.distance) query += `&maxDistance=${values.distance}`;
    if (values.availability) query += `&availablity=${values.availability}`;
    return router.push(query);
  };
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <ChevronDown className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter Results</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 pt-6"
          >
            <FormField
              control={form.control}
              name="distance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Distance</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select distance" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1000">Within 1 km</SelectItem>
                      <SelectItem value="2000">Within 2 km</SelectItem>
                      <SelectItem value="5000">Within 5 km</SelectItem>
                      <SelectItem value="10000">Within 10 km</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="availability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Availability</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select availability" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow</SelectItem>
                      <SelectItem value="this_week">This Week</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <Button className="w-full" onClick={() => setIsOpen(false)}>
              Apply Filters
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
