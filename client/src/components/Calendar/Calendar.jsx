import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { socket } from '../../socket';
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent
} from '../../utils/api'; // <- tvoj helper file

const availableColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899',
  '#06B6D4', '#84CC16', '#D97706', '#F43F5E', '#6366F1'
];

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [userColorMap, setUserColorMap] = useState({});
  const [currentUser, setCurrentUser] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventStartHour, setNewEventStartHour] = useState('09');
  const [newEventStartMinute, setNewEventStartMinute] = useState('00');
  const [newEventEndHour, setNewEventEndHour] = useState('10');
  const [newEventEndMinute, setNewEventEndMinute] = useState('00');

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  const calendarRef = useRef(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const parseServerDate = (serverDateString) => {
    const serverDate = new Date(serverDateString);
    const offsetMinutes = serverDate.getTimezoneOffset(); // npr. -120 minuta za CEST
    // Pomicanje datuma unazad za offset "poništava" automatski pomak
    return new Date(serverDate.getTime() + offsetMinutes * 60000);
  };

  const generateYears = () => {
    const currentYearValue = new Date().getFullYear();
    const years = [];
    for (let year = currentYearValue - 5; year <= currentYearValue + 5; year++) {
      years.push(year);
    }
    return years;
  };

  const navigateToDate = (year, month) => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(new Date(year, month - 1, 1));
    }
  };

  const handleYearChange = (newYear) => {
    setCurrentYear(newYear);
    navigateToDate(newYear, currentMonth);
  };

  const handleMonthChange = (newMonth) => {
    setCurrentMonth(newMonth);
    navigateToDate(currentYear, newMonth);
  };

  const handleDatesSet = (dateInfo) => {
    const viewDate = dateInfo.view.currentStart;
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + 1;
    if (year !== currentYear) setCurrentYear(year);
    if (month !== currentMonth) setCurrentMonth(month);
  };

  // Helper function to get username by userId
  const getUsernameById = (userId) => {
    const user = allUsers.find(u => u._id.toString() === userId);
    return user ? user.username : 'Unknown user';
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setCurrentUser(u.id || u._id);
        setCurrentUsername(u.username);
      }

      try {
        // --- USERS
        const usersRes = await fetch('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const usersData = await usersRes.json();
        setAllUsers(usersData);

        const colorMap = {};
        usersData.forEach((u, idx) => {
          colorMap[u._id.toString()] = availableColors[idx % availableColors.length];
        });
        setUserColorMap(colorMap);

        // --- EVENTS
        const eventsData = await fetchEvents();

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const validEvents = [];
        for (const ev of eventsData) {
          const endDate = new Date(ev.endTime);

          if (endDate < oneWeekAgo) {
            await deleteEvent(ev._id).catch(console.error);
          } else {
            let userId = null;
            if (ev.createdBy) {
              userId = ev.createdBy._id ? ev.createdBy._id.toString() : ev.createdBy.toString();
            }

            const color = userId ? userColorMap[userId] || '#000' : '#888';

            validEvents.push({
              id: ev._id,
              title: ev.title,
              start: parseServerDate(ev.startTime),
              end: parseServerDate(ev.endTime),
              backgroundColor: color,
              borderColor: color,
              textColor: 'white',
              extendedProps: { description: ev.description || '', userId }
            });
          }
        }

        // --- HOLIDAYS
        const holidaysRes = await fetch('http://localhost:5000/api/holidays', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const holidaysData = await holidaysRes.json();

        // dodaj blagdane
        const allEvents = [...validEvents, ...holidaysData];

        setEvents(allEvents);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    socket.connect();

    socket.on('calendar-updated', (eventData) => {
      const userId = eventData.createdBy._id ? eventData.createdBy._id.toString() : eventData.createdBy.toString();
      const color = userColorMap[userId] || '#000';
      const newEv = {
        id: eventData._id,
        title: eventData.title,
        start: parseServerDate(eventData.startTime),
        end: parseServerDate(eventData.endTime),
        backgroundColor: color,
        borderColor: color,
        textColor: 'white',
        extendedProps: { description: eventData.description || '', userId: eventData.createdBy }
      };
      setEvents(prev => {
        const exists = prev.find(e => e.id === eventData._id);
        return exists ? prev.map(e => e.id === eventData._id ? newEv : e) : [...prev, newEv];
      });
    });

    socket.on('event-removed', (eventId) => {
      console.log('Event obrisan:', eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
    });

    return () => {
      socket.off('calendar-updated');
      socket.off('event-removed');
      socket.disconnect();
    };
  }, [userColorMap]);


  const openAddEventModal = (dateObj) => {
    const dayStr = dateObj.toISOString().split('T')[0];
    setSelectedDate(dayStr);
    setNewEventTitle('');
    setNewEventDesc('');
    setNewEventStartHour('09');
    setNewEventStartMinute('00');
    setNewEventEndHour('10');
    setNewEventEndMinute('00');
    setModalOpen(true);
  };

  const openDayOverlay = (dayStr) => {
    setSelectedDate(dayStr);
    setOverlayOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!currentUser || !newEventTitle.trim()) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const [year, month, day] = selectedDate.split('-').map(Number);

    // 🛠️ POPRAVAK: Ponovno dodan 'day + 1' za rješavanje problema s danom.
    // Time se kompenzira FullCalendar/JavaScript obrada datuma koja se primjenjivala ranije.
    const correctedDay = day + 1;

    // Korištenje Date.UTC za stvaranje datuma s lokalnim satima
    const startDate = new Date(Date.UTC(
      year,
      month - 1,
      correctedDay, // <-- Korigirani dan (+ 1)
      Number(newEventStartHour),
      Number(newEventStartMinute)
    ));

    const endDate = new Date(Date.UTC(
      year,
      month - 1,
      correctedDay, // <-- Korigirani dan (+ 1)
      Number(newEventEndHour),
      Number(newEventEndMinute)
    ));

    try {
      const savedEvent = await createEvent({
        title: newEventTitle,
        description: newEventDesc,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        createdBy: currentUser
      });
      const userId = currentUser.toString(); // osiguraj da je string
      const color = userColorMap[userId] || '#000';

      // Korištenje parseServerDate za konzistentan prikaz FullCalendar objekta
      const newEv = {
        id: savedEvent._id,
        title: savedEvent.title,
        start: parseServerDate(savedEvent.startTime),
        end: parseServerDate(savedEvent.endTime),
        backgroundColor: color,
        borderColor: color,
        textColor: 'white',
        extendedProps: {
          description: savedEvent.description || '',
          userId: savedEvent.createdBy
        }
      };

      setEvents(prev => [...prev, newEv]);

      // Obavijesti druge korisnike
      socket.emit('event-added', savedEvent);

      setModalOpen(false);
      setNewEventTitle('');
      setNewEventDesc('');
    } catch (err) {
      console.error(err);
      alert('Failed to save event: ' + err.message);
    }
  };
  const handleUpdateEvent = async () => {
    if (!editingEvent) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const offsetMinutes = editingEvent.start.getTimezoneOffset();
    const adjustedStart = new Date(editingEvent.start.getTime() - offsetMinutes * 60000);
    const adjustedEnd = new Date(editingEvent.end.getTime() - offsetMinutes * 60000);

    try {
      const updatedEvent = await updateEvent(editingEvent.id, {
        title: editingEvent.title,
        description: editingEvent.description,
        startTime: adjustedStart.toISOString(),
        endTime: adjustedEnd.toISOString()
      });

      setEvents(prev => prev.map(ev =>
        ev.id === updatedEvent._id
          ? {
            ...ev,
            title: updatedEvent.title,
            start: editingEvent.start,
            end: editingEvent.end,
            extendedProps: { ...ev.extendedProps, description: updatedEvent.description }
          }
          : ev
      ));

      // ← DODAJ OVO: Obavijesti druge korisnike
      socket.emit('event-updated', updatedEvent);

      setEditingEvent(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent) return;
    const token = localStorage.getItem('token');

    try {
      await deleteEvent(editingEvent.id);

      setEvents(prev => prev.filter(ev => ev.id !== editingEvent.id));
      socket.emit('event-deleted', editingEvent.id);
      setEditingEvent(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const renderEventContent = (eventInfo) => {
    // ako je holiday → samo title, bez vremena
    if (eventInfo.event.extendedProps.isHoliday) {
      return (
        <div
          style={{
            backgroundColor: eventInfo.event.backgroundColor || 'red',
            color: eventInfo.event.textColor || 'white',
            padding: '2px 4px',
            borderRadius: '4px',
            fontSize: '0.85em',
            textAlign: 'center',
          }}
        >
          {eventInfo.event.title}
        </div>
      );
    }

    const start = eventInfo.event.start instanceof Date ? eventInfo.event.start : null;
    const end = eventInfo.event.end instanceof Date ? eventInfo.event.end : null;

    if (!start || !end) return <>{eventInfo.event.title}</>;

    return (
      <div
        style={{
          backgroundColor: eventInfo.event.backgroundColor,
          color: eventInfo.event.textColor,
          padding: '2px 4px',
          borderRadius: '4px',
          fontSize: '0.85em',
          textAlign: 'center',
          height: '100%',
        }}
        title={`${eventInfo.event.title}\n${start ? start.toLocaleTimeString([], { hour12: false }) : ''} - ${end ? end.toLocaleTimeString([], { hour12: false }) : ''}`}
      >
        {eventInfo.event.title}
        <br />
        <span style={{ fontSize: '0.7em' }}>
          {start ? start.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }) : ''}{' '}
          -{' '}
          {end ? end.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }) : ''}
        </span>
      </div>
    );
  };


  const dayEvents = events
    .filter(ev =>
      selectedDate &&
      new Date(ev.start).toDateString() === new Date(selectedDate).toDateString() &&
      !ev.extendedProps?.isHoliday // <-- ignoriraj praznike
    )
    .sort((a, b) => {
      const durationA = new Date(a.end) - new Date(a.start);
      const durationB = new Date(b.end) - new Date(b.start);
      if (durationA !== durationB) return durationA - durationB;
      return new Date(a.start) - new Date(b.start);
    });


  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
        }
        #root {
          margin: 0;
          padding: 0;
          min-height: 100vh;
        }
        /* Responzivni stilovi za FullCalendar */
        @media (max-width: 768px) {
          .fc-toolbar-chunk {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
          .fc-toolbar-title {
            font-size: 1.2em !important;
            margin: 0.5em 0 !important;
          }
          .fc-button {
            padding: 0.2em 0.4em !important;
            font-size: 0.8em !important;
          }
          .fc-daygrid-event {
            font-size: 0.7em !important;
          }
          .fc-timegrid-slot-label {
            font-size: 0.7em !important;
          }
        }
        @media (max-width: 480px) {
          .fc-toolbar-title {
            font-size: 1em !important;
          }
          .fc-button {
            padding: 0.1em 0.3em !important;
            font-size: 0.7em !important;
          }
          .fc-add-event-btn {
            font-size: 0.8em !important;
            right: 2px !important;
            top: 2px !important;
          }
        }
      `}</style>
      <div className="min-h-screen w-full">
        {/* Calendar Navigation */}
        <div className="p-2 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          <div className="hidden sm:block"></div>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <label className="text-gray-700 font-medium text-sm sm:text-base">Year:</label>
              <select
                value={currentYear}
                onChange={e => handleYearChange(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {generateYears().map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-700 font-medium text-sm sm:text-base">Month:</label>
              <select
                value={currentMonth}
                onChange={e => handleMonthChange(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {monthNames.map((m, idx) => <option key={idx + 1} value={idx + 1}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="px-2 sm:px-4 md:px-6">
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'today prev,next',
              center: 'title',
              right:
                window.innerWidth < 768
                  ? 'timeGridDay'
                  : 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            slotDuration="00:30:00"
            allDaySlot={false}
            events={events}
            eventContent={renderEventContent}
            height="auto"
            datesSet={handleDatesSet}
            dateClick={(info) => {
              if (info.jsEvent.target.closest('.fc-add-event-btn')) return;
              const dayStr = info.date.toLocaleDateString('en-CA');
              openDayOverlay(dayStr);
            }}
            eventClick={(info) => {
              if (info.event.extendedProps.isHoliday) {
                info.jsEvent.preventDefault();
                return; // spriječi bilo kakvu akciju
              }
              // normalni event edit
              setEditingEvent({
                id: info.event.id,
                title: info.event.title,
                start: info.event.start,
                end: info.event.end,
                backgroundColor: info.event.backgroundColor,
                textColor: info.event.textColor,
                description: info.event.extendedProps.description,
                userId: info.event.extendedProps.userId,
              });
            }}


            dayCellDidMount={(info) => {
              const btn = document.createElement('button');
              btn.innerHTML = '+';
              btn.className =
                'fc-add-event-btn absolute text-purple-600 hover:text-purple-800 text-md md:text-base z-10';

              const viewType = info.view.type;
              if (viewType === 'dayGridMonth') {
                btn.style.top = '2px';
                btn.style.right = '25px';
              } else {
                btn.style.top = '4px';
                btn.style.right = '4px';
              }

              btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openAddEventModal(info.date);
              });

              info.el.style.position = 'relative';

              // 📌 dodaj "+" samo za današnji ili buduće dane
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const cellDate = new Date(info.date);
              cellDate.setHours(0, 0, 0, 0);

              if (cellDate >= today) {
                info.el.appendChild(btn);
              }
            }}
            dayHeaderClassNames={() => 'bg-purple-300'}
            slotLabelClassNames={() => 'bg-purple-300'}
          />

        </div>

        {/* Overlay za detalje / edit event */}
        {editingEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-lg w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-bold pr-4">{editingEvent.title}</h2>
                <button
                  className="text-gray-600 hover:text-gray-800 text-xl flex-shrink-0"
                  onClick={() => setEditingEvent(null)}
                >
                  ×
                </button>
              </div>

              {/* Created by information */}
              <div className="mb-3 p-2 bg-gray-100 rounded">
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  Created by: {getUsernameById(editingEvent.userId)}
                </span>
              </div>

              {currentUser === editingEvent.userId ? (
                <>
                  <input
                    className="border p-2 w-full mb-2 rounded text-sm sm:text-base"
                    value={editingEvent.title}
                    onChange={e => setEditingEvent(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Event Title"
                  />
                  <textarea
                    className="border p-2 w-full mb-2 rounded text-sm sm:text-base"
                    value={editingEvent.description}
                    onChange={e => setEditingEvent(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description (optional)"
                    rows="3"
                  />

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="flex flex-col">
                      <label className="text-xs sm:text-sm font-medium mb-1">Start Hour</label>
                      <select
                        value={editingEvent.start.getHours()}
                        onChange={e => {
                          const date = new Date(editingEvent.start);
                          date.setHours(Number(e.target.value));
                          setEditingEvent(prev => ({ ...prev, start: date }));
                        }}
                        className="border p-1 rounded text-sm"
                      >
                        {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs sm:text-sm font-medium mb-1">Start Minute</label>
                      <select
                        value={editingEvent.start.getMinutes()}
                        onChange={e => {
                          const date = new Date(editingEvent.start);
                          date.setMinutes(Number(e.target.value));
                          setEditingEvent(prev => ({ ...prev, start: date }));
                        }}
                        className="border p-1 rounded text-sm"
                      >
                        {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex flex-col">
                      <label className="text-xs sm:text-sm font-medium mb-1">End Hour</label>
                      <select
                        value={editingEvent.end.getHours()}
                        onChange={e => {
                          const date = new Date(editingEvent.end);
                          date.setHours(Number(e.target.value));
                          setEditingEvent(prev => ({ ...prev, end: date }));
                        }}
                        className="border p-1 rounded text-sm"
                      >
                        {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs sm:text-sm font-medium mb-1">End Minute</label>
                      <select
                        value={editingEvent.end.getMinutes()}
                        onChange={e => {
                          const date = new Date(editingEvent.end);
                          date.setMinutes(Number(e.target.value));
                          setEditingEvent(prev => ({ ...prev, end: date }));
                        }}
                        className="border p-1 rounded text-sm"
                      >
                        {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-2">
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-3xl transition-colors text-sm sm:text-base order-2 sm:order-1"
                      onClick={handleDeleteEvent}
                    >
                      Delete
                    </button>
                    <button
                      className={`px-3 sm:px-4 py-2 rounded-3xl text-white transition-colors text-sm sm:text-base order-1 sm:order-2 ${editingEvent.title.trim()
                          ? 'bg-blue-500 hover:bg-blue-600'
                          : 'bg-gray-400 cursor-not-allowed'
                        }`}
                      onClick={handleUpdateEvent}
                      disabled={!editingEvent.title.trim()}
                    >
                      Save
                    </button>
                  </div>
                </>
              ) : (
                <div>
                  <p className="mb-2 text-sm sm:text-base">{editingEvent.description || ''}</p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {editingEvent.start.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })} -{' '}
                    {editingEvent.end.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Overlay za prikaz eventa po danu */}
        {overlayOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center z-50 overflow-y-auto py-4 px-4">
            <div className="bg-white p-4 rounded-3xl shadow-lg w-full max-w-sm sm:max-w-md max-h-fit my-auto overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-bold pr-4">
                  Events on {selectedDate ? new Date(selectedDate).toLocaleDateString('en-GB') : ''}
                </h2>
                <button
                  className="text-gray-600 hover:text-gray-800 text-xl flex-shrink-0"
                  onClick={() => setOverlayOpen(false)}
                >
                  ×
                </button>
              </div>
              {dayEvents.length === 0 && <div className="text-gray-500 text-sm sm:text-base">No events</div>}
              {dayEvents.map(ev => (
                <div key={ev.id} className="p-2 mb-2 rounded text-sm sm:text-base" style={{ backgroundColor: ev.backgroundColor, color: ev.textColor }}>
                  <strong>{ev.title}</strong> <br />
                  {!ev.extendedProps.isHoliday && (
                    <span style={{ fontSize: '0.8em' }}>
                      {new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} -
                      {new Date(ev.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                  )}
                  <br />
                  <span style={{ fontSize: '0.75em', opacity: 0.8 }}>
                    Created by: {getUsernameById(ev.extendedProps.userId)}
                  </span>
                </div>
              ))}

            </div>
          </div>
        )}

        {/* Modal za dodavanje eventa */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-lg w-full max-w-sm sm:max-w-md">
              <h2 className="text-lg sm:text-xl font-bold mb-4">Add Event</h2>
              <input
                type="text"
                placeholder="Event Title *"
                className="border p-2 w-full mb-2 rounded text-sm sm:text-base"
                value={newEventTitle}
                onChange={e => setNewEventTitle(e.target.value)}
              />
              <textarea
                placeholder="Description (optional)"
                className="border p-2 w-full mb-2 rounded text-sm sm:text-base"
                value={newEventDesc}
                onChange={e => setNewEventDesc(e.target.value)}
                rows="3"
              />

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-medium mb-1">Start Hour</label>
                  <select
                    value={newEventStartHour}
                    onChange={e => setNewEventStartHour(e.target.value)}
                    className="border p-1 rounded text-sm"
                  >
                    {Array.from({ length: 24 }, (_, i) => <option key={i} value={i.toString().padStart(2, '0')}>{i}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-medium mb-1">Start Minute</label>
                  <select
                    value={newEventStartMinute}
                    onChange={e => setNewEventStartMinute(e.target.value)}
                    className="border p-1 rounded text-sm"
                  >
                    {Array.from({ length: 60 }, (_, i) => <option key={i} value={i.toString().padStart(2, '0')}>{i}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-medium mb-1">End Hour</label>
                  <select
                    value={newEventEndHour}
                    onChange={e => setNewEventEndHour(e.target.value)}
                    className="border p-1 rounded text-sm"
                  >
                    {Array.from({ length: 24 }, (_, i) => <option key={i} value={i.toString().padStart(2, '0')}>{i}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs sm:text-sm font-medium mb-1">End Minute</label>
                  <select
                    value={newEventEndMinute}
                    onChange={e => setNewEventEndMinute(e.target.value)}
                    className="border p-1 rounded text-sm"
                  >
                    {Array.from({ length: 60 }, (_, i) => <option key={i} value={i.toString().padStart(2, '0')}>{i}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <button
                  className="bg-gray-300 hover:bg-gray-400 px-3 sm:px-4 py-2 rounded-3xl transition-colors text-sm sm:text-base order-2 sm:order-1"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className={`px-4 py-2 rounded-3xl text-white transition-colors ${newEventTitle.trim()
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  onClick={handleSaveEvent}
                  disabled={!newEventTitle.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Calendar;