# Event Creation + Enrichment Flow - brainstorm


## 0) Overview

[Google Calendar]
[ - name        ]
[ - location    ]
[ - date, time  ]
[ - recurring   ] - limitation: can't choose "first AND third Fridays of Mo"
[ - reminders   ]

[Firebase - Events     ]
[ - google_calendar_id ] - required link to Google event id
[ - event_type         ] - used in filters + modal
[ - dance_styles       ] - comma-separated, used in filters
[ - description        ] - shown in modal
[ - price              ] - shown in modal
[ - flyer_link         ] - image preview + expanded modal
[ - safety_policy      ] - shown in modal
[ - organizer_id       ] - optional reference to organizers doc

[Firebase - Organizers] - resolved via events.organizer_id on event click
[ - first_name        ]
[ - last_name         ]
[ - facebook_link     ]
[ - instagram_link    ]
[ - website_link      ]

[Website Event (Opened)]
[ - title              ] - from Google
[ - date               ] - from Google start
[ - time range         ] - from Google start/end
[ - description        ] - from Firebase events.description (if present)
[ - event_type         ] - from Firebase events.event_type (if present)
[ - price              ] - from Firebase events.price (if present)
[ - flyer              ] - preview + expand modal from Firebase events.
[ - flyer_link         ] - optional
[ - organizer name     ] - from organizers first_name + last_name (if linked)
[ - organizer links    ] - facebook/instagram/website (if linked + present)
[ - safety_policy      ] - from Firebase events.safety_policy (if present)
[ - fallback note      ] - "No additional event details found in the database."
[ - fallback event id  ] - clicked Google event id

######################################
PROPOSAL

[ Website Form ]
[ - title      ] - 

[Website Event (Opened)]
[ - title              ] - from Google
[ - date               ] - from Google start
[ - time range         ] - from Google start/end
[ - description        ] - from Firebase events.description (if present)
[ - event_type         ] - from Firebase events.event_type (if present)
[ - price              ] - from Firebase events.price (if present)
[ - flyer              ] - preview + expand modal from Firebase events.
[ - flyer_link         ] - optional
[ - organizer name     ] - from organizers first_name + last_name (if linked)
[ - organizer links    ] - facebook/instagram/website (if linked + present)
[ - safety_policy      ] - from Firebase events.safety_policy (if present)
[ - fallback note      ] - "No additional event details found in the database."
[ - fallback event id  ] - clicked Google event id

## 1) Source of truth for calendar events

- The visible calendar events come from Google Calendar API responses (not directly from Firestore).
- In [src/App.jsx](src/App.jsx), the app fetches events from `CALENDAR_IDS` and builds each event with:
	- `id` (Google Calendar event id)
	- `title`
	- `start`
	- `end`

## 2) Extra details source

- Additional metadata is stored in Firestore:
	- Collection: `events`
	- Optional related collection: `organizers`

- The linkage key between Google and Firestore is:
	- Firestore field: `google_calendar_id`
	- Value must exactly match Google event `id`

## 3) Current “create event” flow (manual)

There is no live submit form yet.

- In [src/header.jsx](src/header.jsx), the `Submit an Event` button calls `onSubmitEvent`.
- In [src/App.jsx](src/App.jsx), `handleSubmitEvent()` currently only shows an alert.

So the operational flow today is:

1. Create/update the event in Google Calendar.
2. Get the Google event id.
3. Add/update matching Firestore data in `events` using `google_calendar_id`.
4. (Optional) Add organizer record in `organizers` and store its id in `events.organizer_id`.

## 4) What the homepage fetches for display/filtering

During load, [src/App.jsx](src/App.jsx) does two fetches:

1. Reads Firestore `events` collection once and maps records by `google_calendar_id`.
2. Reads Google Calendar events from each calendar id.

Then each Google event is enriched (if Firestore match exists) with:

- `event_type`
- `dance_styles`

Those fields are used for filtering in the main calendar list/grid.

## 5) What the event modal fetches on click

When a user clicks an event in [src/calendar.jsx](src/calendar.jsx):

1. Base data is taken from Google (`title`, `start`, `end`, `id`).
2. Firestore query runs on `events` where `google_calendar_id == clicked Google id`.
3. If found, event metadata is merged into modal data.
4. If `organizer_id` exists, app fetches `organizers/{organizer_id}` and merges organizer links/details.
5. Modal displays combined Google + Firestore content.

If no Firestore match exists, modal still renders Google details and shows “No additional event details found in the database.”

## 6) Firestore fields currently used by UI

### `events` collection

Required for linking:
- `google_calendar_id`

Displayed when present:
- `description`
- `event_type`
- `price`
- `flyer_link`
- `safety_policy`
- `organizer_id` (to resolve organizer)

Used for filtering:
- `event_type`
- `dance_styles` (currently parsed as comma-separated string)

### `organizers` collection

Displayed when linked through `organizer_id`:
- `first_name`
- `last_name`
- `facebook_link`
- `instagram_link`
- `website_link`

## 7) Quick checklist for adding a new event with full details

1. Add event to Google Calendar.
2. Copy Google event id.
3. In Firestore `events`, create/update doc with matching `google_calendar_id`.
4. Add fields needed for display/filter (`event_type`, `dance_styles`, etc.).
5. If organizer details are needed:
	 - create/update doc in `organizers`
	 - set `events.organizer_id` to that organizer doc id.
6. Reload site and click event to verify modal enrichment.

## 8) Known implementation notes

- Filtering applies best to events that have Firestore metadata.
- `dance_styles` is interpreted as a comma-separated string today.
- `Submit an Event` is not wired to persistence yet.
