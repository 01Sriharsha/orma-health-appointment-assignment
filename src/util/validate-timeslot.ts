import moment from "moment";

export const validateTimeslot = (slotTime: string, date: Date): boolean => {
  const [startTime] = slotTime.split("-");
  const slotMoment = moment(startTime, "hh:mmA");
  const currentTime = moment();

  const isSameDate = moment(date).isSame(currentTime, "day");

  if (!isSameDate) {
    return false;
  }

  return slotMoment.hour() < currentTime.hour();
};
