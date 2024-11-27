"use client";

import { useRef, useState } from "react";
import moment from "moment";
import * as z from "zod";
import { Loader } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { ApiResponse } from "@/util/api-response";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { validateTimeslot } from "@/util/validate-timeslot";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  contact: z.string().min(10, {
    message: "Contact must be at least 10 characters.",
  }),
  timeSlot: z.string().min(1, {
    message: "Please select a time slot.",
  }),
});

type AppointmentDialogProps = {
  doctorId: string;
};

export default function AppointmentDialog({
  doctorId,
}: AppointmentDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [error, setError] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      contact: "",
      timeSlot: "",
    },
  });

  const maxDate = moment().add(1, "month").toDate();

  const closeDialog = () => closeRef?.current?.click();

  // Fetching timeslots based on selected day
  const timeslotMutation = useMutation({
    mutationFn: async (selectedDate: Date) => {
      setError("");
      try {
        const dayOfWeek = moment(selectedDate).format("dddd");
        const response = await axios.get<
          ApiResponse<{ time: string; isFull: boolean }[]>
        >(`/doctors/slots?doctorId=${doctorId}&day=${dayOfWeek}`, {
          method: "GET",
        });
        return response.data.data || [];
      } catch (error: any) {
        console.log("Time slots fetch error", error);
        setError(error.response.data.message);
        return [];
      }
    },
  });

  const appointmentMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      try {
        const response = await axios.post<ApiResponse>("/appointments", {
          doctorId,
          patientName: values.name,
          patientContact: values.contact,
          timeSlot: values.timeSlot,
          appointmentDate: date,
        });
        toast.success(response.data.message);
        form.reset();
        setDate(null);
        closeDialog()
      } catch (error: any) {
        console.log("appointment book error", error);
        toast.error(error.response.data.message);
      }
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Book Appointment</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-auto">
        <DialogHeader className="grid place-items-center">
          <DialogTitle>Book An Appointment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => appointmentMutation.mutate(v))}
            className="space-y-8"
          >
            <div className="w-full grid place-items-center">
              <FormLabel className="w-full">Select date</FormLabel>
              <Calendar
                mode="single"
                selected={date!}
                onSelect={(date) => {
                  setDate(date!);
                  timeslotMutation.mutate(date!);
                }}
                disabled={(date) =>
                  moment(date).isBefore(moment(), "day") ||
                  moment(date).isAfter(maxDate)
                }
              />
            </div>
            {timeslotMutation.isPending ? (
              <Loader size={"1.1rem"} className="animate-spin w-full mx-auto" />
            ) : (
              timeslotMutation.data &&
              timeslotMutation.data.length > 0 && (
                <FormField
                  control={form.control}
                  name="timeSlot"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Select a time slot:</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-wrap justify-between gap-2"
                        >
                          {timeslotMutation.data.map((slot) => (
                            <Button
                              key={slot.time}
                              type="button"
                              disabled={
                                slot.isFull ||
                                validateTimeslot(slot.time, date!)
                              }
                              variant={
                                field.value === slot.time
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() =>
                                form.setValue("timeSlot", slot.time)
                              }
                            >
                              {slot.time}
                            </Button>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )
            )}
            {error && <p className="text-destructive text-center">{error}</p>}
            {form.watch("timeSlot") && (
              <>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your contact information"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <Button disabled={appointmentMutation.isPending} type="submit">
              Submit
            </Button>
          </form>
        </Form>
      </DialogContent>
      <DialogClose ref={closeRef} className="hidden" />
    </Dialog>
  );
}
