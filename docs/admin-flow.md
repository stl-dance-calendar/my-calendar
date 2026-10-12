2 Flows:

## 1 We generate event with details
- admin logs into Firebase and GCal
- adds calendar event, adds firebase details manually

(OR submits on submission page, then logs in as admin)
OR as admin can just create so


## 2 We handle submitted events
- need an admin login page
- need an option on admin side to clear by contact/email provided (for bots, spam)
- need dropdown feature so if an event was already created with the same name (maybe a new series of old event, maybe some new additional options but prefill based on event name)
- need to implement best design here:
  1. Create Calendar Event (creates multiple if 'first and third Friday' scenario)
  2. Enter calendar event id(s) - or just confirm created with ids
  3. Update Firebase and publish to page (sets event status to 'visible')


  ========================================
  Requests Submitted | Submit a New Event as Admin (tabs)
  [timestamp of request] [EventName] [date/time] [Contact first/last name] [recurring: yes/no]

  ========================================
  opens to 

  ========================================
  Requests Submitted | Submit a New Event as Admin (tabs)
  [timestamp of request] [EventName] [date/time] [Contact first/last name] [recurring: yes/no]

  ========================================