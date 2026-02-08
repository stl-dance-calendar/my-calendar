import React, { useState } from "react";
import danceLogo from "../calendar_logo.png";
import AboutContent from "./aboutContent";

const Header = ({ onSubmitEvent, danceCalendarId }) => {
  const [showAboutModal, setShowAboutModal] = useState(false);
  const handleAddToCalendar = () => {
    if (danceCalendarId) {
      window.open(`https://calendar.google.com/calendar/render?cid=${encodeURIComponent(danceCalendarId)}`, '_blank');
    }
  };

  const handleAbout = () => {
    setShowAboutModal(true);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        marginBottom: "20px",
      }}
    >
      {/* Top row: Logo and Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        {/* Left side: Logo */}
        <img src={danceLogo} alt="Dance Calendar Logo" style={{ height: "clamp(80px, 20vw, 160px)", margin: 0 }} />

        {/* Right side: Buttons */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={handleAbout}
        >
          About
        </button>
        <button
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={handleAddToCalendar}
        >
          Add to My Google Calendar
        </button>
        <button
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={onSubmitEvent}
        >
          Submit an Event
        </button>
        </div>
      </div>

      {/* About Modal */}
      {showAboutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <AboutContent />
            <button
              onClick={() => setShowAboutModal(false)}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;