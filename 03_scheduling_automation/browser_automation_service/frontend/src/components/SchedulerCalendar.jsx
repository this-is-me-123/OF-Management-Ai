import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { PostSchedulerModal } from "./PostSchedulerModal";
import { useScheduledPosts } from "../hooks/useScheduledPosts";

const localizer = momentLocalizer(moment);

export const SchedulerCalendar = () => {
  const { posts, fetchPosts } = useScheduledPosts();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSelectSlot = (slotInfo) => {
    setSelectedDate(slotInfo.start);
    setModalOpen(true);
  };

  const events = posts.map(p => ({
    title: p.caption,
    start: new Date(p.datetime),
    end: new Date(moment(p.datetime).add(30, 'minutes')),
  }));

  return (
    <div className="p-4">
      <h2 className="text-xl mb-2">📅 Post Scheduler</h2>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        selectable
        onSelectSlot={handleSelectSlot}
      />
      {modalOpen && (
        <PostSchedulerModal
          date={selectedDate}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};
