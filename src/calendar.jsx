import React, { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Calendar IDs (used by App.jsx and Header.jsx)
export const CALENDAR_IDS = [
  'en.usa#holiday@group.v.calendar.google.com', // US holidays
  'dee75596aea9533d01629c0cfc3c9561723c5d0db26e671aa7370189f83e9aea@group.calendar.google.com' // Main calendar
];
export const DANCE_CALENDAR_ID = 'dee75596aea9533d01629c0cfc3c9561723c5d0db26e671aa7370189f83e9aea@group.calendar.google.com';

// Firebase config (same as App.jsx)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const Calendar = ({ events, view = "dayGridWeek", onViewChange, danceCalendarId }) => {
  const calendarRef = useRef(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [clickedEventId, setClickedEventId] = useState(null);
  const [expandedFlyer, setExpandedFlyer] = useState(false);

  // When parent `view` prop changes, instruct FullCalendar to change view
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi && view) calendarApi.changeView(view);
  }, [view]);

  const handleEventClick = async (info) => {
    setClickedEventId(info.event.id);
    
    // Start with Google Calendar data
    const googleCalendarData = {
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      _fromGoogle: true,
    };

    // Fetch from Firestore using google_calendar_id field
    const q = query(collection(db, 'events'), where('google_calendar_id', '==', info.event.id));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const eventData = querySnapshot.docs[0].data();
      
      // Fetch organizer data if organizer_id exists
      let organizerData = null;
      if (eventData.organizer_id) {
        const organizerRef = doc(db, 'organizers', eventData.organizer_id);
        const organizerSnap = await getDoc(organizerRef);
        if (organizerSnap.exists()) {
          const organizer = organizerSnap.data();
          organizerData = {
            name: `${organizer.first_name || ''} ${organizer.last_name || ''}`.trim(),
            facebook_link: organizer.facebook_link,
            instagram_link: organizer.instagram_link,
            website_link: organizer.website_link,
          };
        }
      }
      
      // Combine Google Calendar data with Firebase data
      const combined = {
        ...googleCalendarData,
        ...eventData,
        organizer_data: organizerData,
        _noData: false,
      };
      // console.log('Combined event data:', combined); // DEBUG
      setSelectedEvent(combined);
    } else {
      // Only Google Calendar data available
      // console.log('Only Google Calendar data:', googleCalendarData); // DEBUG
      setSelectedEvent({
        ...googleCalendarData,
        _noData: true,
      });
    }
  };

  const closeModal = () => {
    setSelectedEvent(null);
    setExpandedFlyer(false);
  };

  return (
    <div className={`fc-wrapper ${view}`}>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
        initialView={view}
        headerToolbar={view === "listWeek" ? {
          left: "prev,next",
          center: "title",
          right: "",
        } : {
          left: "prev,next today",
          center: "title",
          right: "dayGridWeek,dayGridMonth",
        }}
        buttonText={{
          today: "Today",
          week: "Week",
          month: "Month",
        }}
        allDaySlot={false}
        events={events}
        height="auto"
        // removes extra week rows in month view
        showNonCurrentDates={false}
        views={{
          dayGridMonth: { fixedWeekCount: false, showNonCurrentDates: false },
          listWeek: { 
            buttonText: "Week",
            titleFormat: { month: 'short', day: 'numeric' }
          },
        }}
        datesSet={(dateInfo) => {
          if (onViewChange) onViewChange(dateInfo.view.type);
        }}
        eventClick={handleEventClick}
      />
      {selectedEvent && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'white', padding: '20px', border: '1px solid black', zIndex: 1000, maxWidth: '600px', overflowY: 'auto', maxHeight: '90vh'
        }}>
          <h2>{selectedEvent.title}</h2>
          
          {/* Google Calendar Data */}
          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Event Details</h3>
            {selectedEvent.start && (
              <p>
                <strong>Date:</strong> {new Date(selectedEvent.start).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
            {selectedEvent.start && selectedEvent.end && (
              <p>
                <strong>Time:</strong> {new Date(selectedEvent.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {new Date(selectedEvent.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
            )}
          </div>

          {/* Firebase Data */}
          {!selectedEvent._noData && (
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
              <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Additional Information</h3>
              
              {selectedEvent.flyer_link && (
                <div style={{ marginTop: '15px' }}>
                  <strong>Flyer:</strong><br />
                  <div 
                    onClick={() => setExpandedFlyer(true)}
                    style={{ 
                      marginTop: '10px', 
                      width: '100%', 
                      height: '200px', 
                      overflow: 'hidden', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      position: 'relative',
                      border: '1px solid #ddd'
                    }}
                  >
                    <img 
                      src={selectedEvent.flyer_link} 
                      alt="Flyer Preview" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover'
                      }} 
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      Click to expand
                    </div>
                  </div>
                </div>
              )}

              {selectedEvent.description && (
                <p><strong>Description:</strong> {selectedEvent.description}</p>
              )}
              
              {selectedEvent.event_type && (
                <p><strong>Event Type:</strong> {selectedEvent.event_type}</p>
              )}

              {selectedEvent.price && (
                <p><strong>Price:</strong> {selectedEvent.price}</p>
              )}

              {selectedEvent.organizer_data && (
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                  <h4 style={{ marginTop: 0, marginBottom: '10px' }}>Organizer</h4>
                  <p><strong>Name:</strong> {selectedEvent.organizer_data.name}</p>
                  
                  {selectedEvent.organizer_data.facebook_link && (
                    <p><strong>Facebook:</strong> <a href={selectedEvent.organizer_data.facebook_link} target="_blank" rel="noopener noreferrer">{selectedEvent.organizer_data.facebook_link}</a></p>
                  )}
                  
                  {selectedEvent.organizer_data.instagram_link && (
                    <p><strong>Instagram:</strong> <a href={selectedEvent.organizer_data.instagram_link} target="_blank" rel="noopener noreferrer">{selectedEvent.organizer_data.instagram_link}</a></p>
                  )}
                  
                  {selectedEvent.organizer_data.website_link && (
                    <p><strong>Website:</strong> <a href={selectedEvent.organizer_data.website_link} target="_blank" rel="noopener noreferrer">{selectedEvent.organizer_data.website_link}</a></p>
                  )}

                  {selectedEvent.safety_policy && (
                <p><strong>Safety Policy:</strong> {selectedEvent.safety_policy}</p>
              )}
                </div>
              )}
            
            </div>
          )}

          {/* No Firebase Data Message */}
          {selectedEvent._noData && (
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
              <p style={{ color: '#666', marginBottom: '10px' }}>No additional event details found in the database.</p>
              <p><strong>Event ID:</strong> <code style={{ backgroundColor: '#f0f0f0', padding: '5px', fontSize: '12px' }}>{clickedEventId}</code></p>
            </div>
          )}

          <button onClick={closeModal} style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
        </div>
      )}

      {/* Expanded Flyer Modal */}
      {expandedFlyer && selectedEvent?.flyer_link && (
        <div 
          onClick={() => setExpandedFlyer(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            cursor: 'pointer'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <img 
              src={selectedEvent.flyer_link} 
              alt="Flyer Full Size" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '90vh',
                objectFit: 'contain'
              }} 
            />
            <button 
              onClick={() => setExpandedFlyer(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '24px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;