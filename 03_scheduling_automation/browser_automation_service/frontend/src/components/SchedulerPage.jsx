import React from "react";
import { SchedulerCalendar } from "./SchedulerCalendar";

const SchedulerPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">📅 Post Scheduler</h1>
      <SchedulerCalendar />
    </div>
  );
};

export default SchedulerPage;
