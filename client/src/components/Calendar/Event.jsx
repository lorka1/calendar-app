import React from "react";

const Event = ({ event }) => {
  return (
    <div
      className={`border rounded-3xl p-4 m-2 shadow-md ${
        event.isHoliday ? "bg-red-100" : "bg-white"
      }`}
    >
      <h3 className="text-lg font-semibold">
        {event.title}
        {event.isHoliday && (
          <span className="ml-2 text-red-600 text-sm">(Blagdan)</span>
        )}
      </h3>
      {event.description && (
        <p className="text-gray-600">{event.description}</p>
      )}
      <p className="text-sm text-gray-500">
        {new Date(event.date).toLocaleDateString("hr-HR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
    </div>
  );
};

export default Event;
