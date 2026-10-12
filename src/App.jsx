import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import axios from "axios";
import Header from "./header";
import Calendar, { CALENDAR_IDS, DANCE_CALENDAR_ID } from "./calendar";
import Filter from "./filter";
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';

const API_KEY = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY;

// In Firebase Console (where you see "Hello, [Name] Welcome to your Firebase project!"):
// Click the gear icon in the left sidebar > "Project settings".
// Scroll down to the "Your apps" section.
// If you haven't added a web app yet:
// Click "Add app" > Select the "</>" web icon.
// Enter a nickname (e.g., "My Calendar App").
// Click "Register app".
// In the "SDK setup and configuration" section, you'll see a firebaseConfig obejct with your keys. Copy the values
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

function App() {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState("dayGridWeek");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState({
    eventType: [],
    danceStyles: [],
  });
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoadingEvents(true);
      try {
        // Fetch all Firebase event metadata once, map by google_calendar_id
        const firebaseEventsMap = new Map();
        try {
          const firebaseSnapshot = await getDocs(collection(db, 'events'));
          firebaseSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data?.google_calendar_id) {
              firebaseEventsMap.set(data.google_calendar_id, data);
            }
          });
        } catch (err) {
          // If Firebase fetch fails, continue with Google Calendar only
        }

        const allEvents = [];
        for (const id of CALENDAR_IDS) {
          const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(id)}/events?key=${API_KEY}`);
          const data = await response.json();
          if (data.error) {
            continue;
          }
          if (data.items && data.items.length > 0) {
            for (const item of data.items) {
              const event = {
                title: item.summary,
                start: item.start.dateTime || item.start.date,
                end: item.end.dateTime || item.end.date,
                id: item.id,
              };

              // Attach Firebase data for filtering (if present)
              const firebaseData = firebaseEventsMap.get(item.id);
              if (firebaseData) {
                event.event_type = firebaseData.event_type || null;
                event.dance_styles = firebaseData.dance_styles || null;
              }

              allEvents.push(event);
            }
          }
        }
        setEvents(allEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchEvents();

    // Fetch initial metadata on load
    const fetchMetadata = async () => {
      try {
        const metadataDoc = await getDoc(doc(db, 'metadata', 'lastUpdate'));
        if (metadataDoc.exists()) {
          const timestamp = metadataDoc.data().timestamp;
          setLastUpdated(new Date(timestamp));
        }
      } catch (error) {
        console.error('Error fetching metadata:', error);
      }
    };
    fetchMetadata();

    // Listen to metadata document for changes
    const unsubscribe = onSnapshot(doc(db, 'metadata', 'lastUpdate'), (doc) => {
      if (doc.exists()) {
        const timestamp = doc.data().timestamp;
        setLastUpdated(new Date(timestamp));
      }
    }, (error) => {
      console.log('Firebase metadata listener error:', error);
    });

    return () => unsubscribe();
  }, []);

  // Handle responsive view switching
  useEffect(() => {
    const handleResize = () => {
      // If screen is narrower than 768px, switch to list week view
      // Otherwise use week view
      if (window.innerWidth < 768) {
        setView("listWeek");
      } else {
        setView("dayGridWeek");
      }
    };

    // Call on mount
    handleResize();

    // Listen for window resize
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSubmitEvent = () => {
    window.location.href = '/submit-an-event';
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  // Filter events based on selected filters
  const filteredEvents = events.filter(event => {
    // If no filters are selected, show all events
    if (selectedFilters.eventType.length === 0 && selectedFilters.danceStyles.length === 0) {
      return true;
    }

    // Check event type filter
    const matchesEventType = selectedFilters.eventType.length === 0 || 
      selectedFilters.eventType.includes(event.event_type);

    // Check dance style filter
    // Parse comma-separated dance_styles, convert to lowercase, trim whitespace
    const eventDanceStyles = event.dance_styles
      ? event.dance_styles
          .split(',')
          .map(style => style.trim().toLowerCase())
      : [];

    const matchesDanceStyles = selectedFilters.danceStyles.length === 0 || 
      selectedFilters.danceStyles.some(selectedStyle => 
        eventDanceStyles.includes(selectedStyle.toLowerCase())
      );

    return matchesEventType && matchesDanceStyles;
  });

  // This is the main render
  // For playing w color: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/named-color
  return (
    <div style={{ padding: "20px", backgroundColor: "#02008f", minHeight: "100vh", overflow: "hidden" }}>
      <Header onSubmitEvent={handleSubmitEvent} danceCalendarId={DANCE_CALENDAR_ID} />
      <Filter selectedFilters={selectedFilters} onFilterChange={setSelectedFilters} />

      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", marginBottom: "20px", overflow: view === "listWeek" ? "auto" : "hidden", maxHeight: view === "listWeek" ? "none" : "auto", height: view === "listWeek" ? "auto" : "auto" }}>
        {isLoadingEvents && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', color: '#555', fontFamily: 'Arial, sans-serif' }}>
            <span className="loading-spinner" aria-hidden="true" />
            <span>Loading events…</span>
          </div>
        )}
        <div style={{ width: "100%", overflow: view === "listWeek" ? "auto" : "hidden" }}>
          <Calendar events={filteredEvents} view={view} onViewChange={handleViewChange} danceCalendarId={DANCE_CALENDAR_ID} />
        </div>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif', color: '#ffd675' }}>
        <h2>STL Afro-Latin Dance Calendar – for dancers, by dancers. The most accurate latin dance calendar in St. Louis MO</h2>
        <p>We're a community of passionate dancers, updating the calendar every week with all the deets you need to find public classes, socials, and other events across the St. Louis Afro‑Latin dance scene. Check out what's happening and be part of the rhythm!</p>

        <p>To learn more or request to add your event, explore our subpages.</p>
        <p>Est. 2026    |    Version: Beta</p>
        {lastUpdated && (
          <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        )} 
      </div>
    </div>
  );
}

export default App;