# STL Afro-Latin Dance Calendar - Project Goals

## Completed Features
- Responsive calendar display (desktop: week grid, mobile: list view)
- Google Calendar integration
- Firebase Firestore backend
- Event filtering by event_type and dance_styles
- About modal with community info
- "Last updated" timestamp
- Logo with responsive sizing
- Mobile-friendly design

---

## In Progress 🔄

### Color Coding
- [ ] Add color coding by dance_styles (e.g., Salsa = red, Bachata = blue, Zouk = green, Kizomba = orange, Other = gray)
- [ ] Update event display to show color indicators
- [ ] Add legend showing color mappings
- [ ] Ensure colors are accessible (sufficient contrast)

---

## Automation & Admin Panel

### Current Approach
**Option 3: Firebase Console (Current - Simplest)**
- Status: In use
- Pros: No coding needed, functional
- Cons: Less user-friendly, manual process
- Description: Go to Firebase > Firestore > manually add documents with event metadata

### Future Enhancement
**Option 1: Admin Page (Planned)**
- Status: Not implemented
- Pros: Better UX, password-protected, integrated with main app
- Cons: Requires additional development
- Implementation: 
  - Add `/admin` route with password/login
  - Only accessible to team members
  - Pre-fill form with Google Calendar event data
  - Auto-populate title, date, time, duration
  - Manual input for: event_type, dance_styles
  - One-click Firebase save

### Alternative (Not Pursuing)
**Option 2: Completely Separate Admin App**
- Pros: Complete separation of concerns
- Cons: Extra deployment, more complexity
- Status: Not planned at this time

---

## Feature Ideas for Future
- [ ] Search functionality
- [ ] Map view showing event locations
---

## Known Limitations
- Event names truncate on mobile (with horizontal scroll available)
- Filters only work on Firebase-enriched events (not all Google Calendar events)
- No authentication on public site (by design)

---

## Questions/Decisions Needed
- When should color coding be implemented?
- Should admin panel be added soon or stick with Firebase Console for now?
- Any additional dance styles or event types needed?
