import React, { useEffect, useMemo, useRef, useState } from "react";
import danceLogo from "../calendar_logo.png";
import { getApp, getApps, initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const initialForm = {
  eventName: "",
  organizerFirstName: "",
  organizerLastName: "",
  organizerId: "",
  organizerPhone: "",
  organizerInstagramHandle: "",
  organizerFacebookPage: "",
  officialEventLink: "",
  location: "",
  date: "",
  recurring: "",
  recurrencePreset: "",
  recurrenceRRule: "",
  recurrenceDetails: "",
  recurrenceAdvancedWeekdays: "",
  recurrenceAdvancedOrdinals: "",
  startTime: "",
  endTime: "",
  danceStyle: "",
  eventType: "",
  safetyPolicyUrl: "",
  contactSafetyPolicyCompanyName: "",
  contactSafetyPolicyUrl: "",
  description: "",
};

const baseDanceStyleOptions = ["Salsa", "Bachata", "Kizomba", "Zouk", "Cha Cha", "Afrobeats", "Other"];
const baseEventTypeOptions = ["Class", "Social", "Performance", "Weekender", "Other"];

const allowedImageMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/heic", "image/heif", "image/webp"];
const allowedImageExtensions = [".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp"];
const recurrencePresetOptions = [
  { value: "daily", label: "Daily", rrule: "FREQ=DAILY" },
  { value: "weekly", label: "Every week", rrule: "FREQ=WEEKLY" },
  { value: "biweekly", label: "Every 2 weeks", rrule: "FREQ=WEEKLY;INTERVAL=2" },
  { value: "monthly-date", label: "Monthly (same date)", rrule: "FREQ=MONTHLY" },
  {
    value: "monthly-first-third-wednesday",
    label: "Every first and third Wednesday",
    rrule: "FREQ=MONTHLY;BYDAY=WE;BYSETPOS=1,3",
  },
  {
    value: "advanced-monthly-weekday",
    label: "Advanced Month: pick weekdays + 1st/2nd/3rd/4th/last",
    rrule: "",
  },
  { value: "custom", label: "Something else (describe it)", rrule: "" },
];

const advancedWeekdayOptions = [
  { value: "MO", label: "Monday" },
  { value: "TU", label: "Tuesday" },
  { value: "WE", label: "Wednesday" },
  { value: "TH", label: "Thursday" },
  { value: "FR", label: "Friday" },
  { value: "SA", label: "Saturday" },
  { value: "SU", label: "Sunday" },
];

const advancedOrdinalOptions = [
  { value: "1", label: "First (1st)", short: "first" },
  { value: "2", label: "Second (2nd)", short: "second" },
  { value: "3", label: "Third (3rd)", short: "third" },
  { value: "4", label: "Fourth (4th)", short: "fourth" },
  { value: "-1", label: "Last", short: "last" },
];

const isValidImageFile = (file) => {
  if (!file) return true;
  const hasValidMime = allowedImageMimeTypes.includes((file.type || "").toLowerCase());
  const lowerName = (file.name || "").toLowerCase();
  const hasValidExtension = allowedImageExtensions.some((ext) => lowerName.endsWith(ext));
  return hasValidMime || hasValidExtension;
};

const isValidHttpUrl = (value) => {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const isValidFacebookUrl = (value) => {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();
    const hasValidProtocol = parsed.protocol === "http:" || parsed.protocol === "https:";
    const isFacebookDomain = hostname === "facebook.com" || hostname.endsWith(".facebook.com");
    return hasValidProtocol && isFacebookDomain;
  } catch {
    return false;
  }
};

const isValidPhoneNumber = (value) => {
  if (!value) return true;
  const digitsOnly = String(value).replace(/\D/g, "");
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
};

const toDdMmYyyy = (isoDate) => {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
};

const parseAnyDateToIso = (value) => {
  if (!value) return "";

  if (typeof value === "object" && typeof value.toDate === "function") {
    const dateObj = value.toDate();
    if (dateObj instanceof Date && !Number.isNaN(dateObj.getTime())) {
      return dateObj.toISOString().slice(0, 10);
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value !== "string") return "";
  const raw = value.trim();
  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const ddMmYyyy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddMmYyyy) {
    const [, day, month, year] = ddMmYyyy;
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return "";
};

const parseTimeToParts = (value) => {
  const empty = { hour: "", minute: "", ampm: "AM" };
  if (!value || typeof value !== "string") return empty;

  const trimmed = value.trim();
  const amPmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (amPmMatch) {
    const hour = String(Number(amPmMatch[1])).padStart(2, "0");
    return { hour, minute: amPmMatch[2], ampm: amPmMatch[3].toUpperCase() };
  }

  const twentyFourMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourMatch) {
    let hourNum = Number(twentyFourMatch[1]);
    const minute = twentyFourMatch[2];
    const ampm = hourNum >= 12 ? "PM" : "AM";
    hourNum = hourNum % 12;
    if (hourNum === 0) hourNum = 12;
    return { hour: String(hourNum).padStart(2, "0"), minute, ampm };
  }

  return empty;
};

const looksLikeImageReference = (value) => {
  if (!value || typeof value !== "string") return false;
  const lower = value.toLowerCase();
  return [".png", ".jpg", ".jpeg", ".heic", ".heif", ".webp"].some((ext) => lower.includes(ext));
};

const parseDanceStyles = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const splitOrganizerName = (fullName) => {
  const cleaned = String(fullName || "").trim();
  if (!cleaned) return { firstName: "", lastName: "" };
  const parts = cleaned.split(/\s+/);
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
};

const toCsv = (values) => values.join(",");

const fromCsv = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const formatListWithAnd = (items) => {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
};

const buildAdvancedMonthlyRRule = (weekdayCodes, ordinalValues) => {
  if (!weekdayCodes.length || !ordinalValues.length) return "";
  return `FREQ=MONTHLY;BYDAY=${weekdayCodes.join(",")};BYSETPOS=${ordinalValues.join(",")}`;
};

const buildAdvancedSummary = (weekdayCodes, ordinalValues) => {
  if (!weekdayCodes.length || !ordinalValues.length) return "";
  const weekdayLabels = weekdayCodes
    .map((code) => advancedWeekdayOptions.find((option) => option.value === code)?.label.toLowerCase())
    .filter(Boolean);
  const ordinalLabels = ordinalValues
    .map((value) => advancedOrdinalOptions.find((option) => option.value === value)?.short)
    .filter(Boolean);
  return `Every ${formatListWithAnd(ordinalLabels)} ${formatListWithAnd(weekdayLabels)}`;
};

export default function SubmitEventPage() {
  const [formData, setFormData] = useState(initialForm);
  const [datePickerValue, setDatePickerValue] = useState("");
  const [startTimeParts, setStartTimeParts] = useState({ hour: "", minute: "", ampm: "AM" });
  const [endTimeParts, setEndTimeParts] = useState({ hour: "", minute: "", ampm: "AM" });
  const [flyerFile, setFlyerFile] = useState(null);
  const [safetyPolicyFile, setSafetyPolicyFile] = useState(null);
  const [contactSafetyPolicyFile, setContactSafetyPolicyFile] = useState(null);
  const [formErrors, setFormErrors] = useState({
    eventName: "",
    location: "",
    date: "",
    recurring: "",
    recurrencePreset: "",
    recurrenceAdvanced: "",
    recurrenceDetails: "",
    startTime: "",
    endTime: "",
    description: "",
    eventType: "",
    danceStyle: "",
    flyer: "",
    safetyPolicyFile: "",
    safetyPolicyUrl: "",
    organizerFirstName: "",
    organizerLastName: "",
    organizerPhone: "",
    organizerFacebookPage: "",
    officialEventLink: "",
    contactSafetyPolicyFile: "",
    contactSafetyPolicyUrl: "",
  });
  const [selectedDanceStyles, setSelectedDanceStyles] = useState([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [eventSuggestions, setEventSuggestions] = useState([]);
  const [selectedEventRecord, setSelectedEventRecord] = useState(null);
  const [isLoadingEventNames, setIsLoadingEventNames] = useState(true);
  const [showEventSuggestions, setShowEventSuggestions] = useState(false);
  const [organizers, setOrganizers] = useState([]);
  const [isLoadingOrganizers, setIsLoadingOrganizers] = useState(true);
  const [showOrganizerSuggestions, setShowOrganizerSuggestions] = useState(false);
  const eventFieldRef = useRef(null);
  const organizerFieldRef = useRef(null);

  useEffect(() => {
    const loadEventNames = async () => {
      setIsLoadingEventNames(true);
      try {
        const snap = await getDocs(collection(db, "events"));
        const records = snap.docs
          .map((docSnap) => {
            const data = docSnap.data();
            const name = (data.title || data.event_name || data.name || "").trim();
            return {
              id: docSnap.id,
              name,
              data,
            };
          })
          .filter((item) => item.name);

        const byName = new Map();
        records.forEach((record) => {
          const key = record.name.toLowerCase();
          if (!byName.has(key)) byName.set(key, record);
        });

        const uniqueSorted = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
        setEventSuggestions(uniqueSorted);
      } catch (error) {
        console.error("Failed to load event names:", error);
        setEventSuggestions([]);
      } finally {
        setIsLoadingEventNames(false);
      }
    };

    loadEventNames();

    const loadOrganizers = async () => {
      setIsLoadingOrganizers(true);
      try {
        const snap = await getDocs(collection(db, "organizers"));
        const items = snap.docs
          .map((docSnap) => {
            const data = docSnap.data();
            const fullName = `${data.first_name || ""} ${data.last_name || ""}`.trim();
            return {
              id: docSnap.id,
              name: fullName || data.name || docSnap.id,
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name));
        setOrganizers(items);
      } catch (error) {
        console.error("Failed to load organizers:", error);
        setOrganizers([]);
      } finally {
        setIsLoadingOrganizers(false);
      }
    };

    loadOrganizers();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (eventFieldRef.current && !eventFieldRef.current.contains(event.target)) {
        setShowEventSuggestions(false);
      }
      if (organizerFieldRef.current && !organizerFieldRef.current.contains(event.target)) {
        setShowOrganizerSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filteredOrganizers = useMemo(() => {
    const query = `${formData.organizerFirstName || ""} ${formData.organizerLastName || ""}`.trim().toLowerCase();
    const baseList = query
      ? organizers.filter((org) => org.name.toLowerCase().includes(query))
      : organizers;
    return baseList.slice(0, 8);
  }, [formData.organizerFirstName, formData.organizerLastName, organizers]);

  const filteredEventNames = useMemo(() => {
    const query = formData.eventName.trim().toLowerCase();
    if (!query) return [];
    const baseList = eventSuggestions.filter((item) => item.name.toLowerCase().includes(query));
    return baseList.slice(0, 8);
  }, [formData.eventName, eventSuggestions]);

  const danceStyleOptions = useMemo(() => {
    const combined = [...baseDanceStyleOptions, ...selectedDanceStyles];
    return [...new Set(combined)];
  }, [selectedDanceStyles]);

  const hasPriorFlyer = Boolean(selectedEventRecord?.data?.flyer_link);
  const hasSelectedPriorEvent = Boolean(selectedEventRecord);
  const hasPriorSafetyPolicy = Boolean(
    selectedEventRecord?.data?.safety_policy_image ||
    selectedEventRecord?.data?.safety_policy_url ||
    selectedEventRecord?.data?.safety_policy ||
    formData.safetyPolicyUrl ||
    looksLikeImageReference(selectedEventRecord?.data?.safety_policy)
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e) => {
    const isoDate = e.target.value; // YYYY-MM-DD from native date picker
    setDatePickerValue(isoDate);

    if (!isoDate) {
      setFormData((prev) => ({ ...prev, date: "" }));
      return;
    }

    const [year, month, day] = isoDate.split("-");
    const formatted = `${day}/${month}/${year}`;
    setFormData((prev) => ({ ...prev, date: formatted }));
  };

  const formatTimeFromParts = (parts) => {
    if (!parts.hour || !parts.minute || !parts.ampm) return "";
    return `${parts.hour}:${parts.minute} ${parts.ampm}`;
  };

  const handleTimePartChange = (fieldName, partName, value) => {
    const setParts = fieldName === "startTime" ? setStartTimeParts : setEndTimeParts;
    const current = fieldName === "startTime" ? startTimeParts : endTimeParts;
    const updated = { ...current, [partName]: value };
    setParts(updated);

    setFormData((prev) => ({
      ...prev,
      [fieldName]: formatTimeFromParts(updated),
    }));
  };

  const handleRecurringToggle = (choice) => {
    if (choice === "No") {
      setFormData((prev) => ({
        ...prev,
        recurring: prev.recurring === choice ? "" : choice,
        recurrencePreset: "",
        recurrenceRRule: "",
        recurrenceDetails: "",
        recurrenceAdvancedWeekdays: "",
        recurrenceAdvancedOrdinals: "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      recurring: prev.recurring === choice ? "" : choice,
    }));
  };

  const handleRecurrencePresetChange = (e) => {
    const { value } = e.target;
    const selectedPreset = recurrencePresetOptions.find((option) => option.value === value);
    setFormData((prev) => ({
      ...prev,
      recurrencePreset: value,
      recurrenceRRule:
        value === "advanced-monthly-weekday"
          ? buildAdvancedMonthlyRRule(fromCsv(prev.recurrenceAdvancedWeekdays), fromCsv(prev.recurrenceAdvancedOrdinals))
          : selectedPreset
            ? selectedPreset.rrule
            : "",
      recurrenceDetails: value === "custom" ? prev.recurrenceDetails : "",
      recurrenceAdvancedWeekdays: value === "advanced-monthly-weekday" ? prev.recurrenceAdvancedWeekdays : "",
      recurrenceAdvancedOrdinals: value === "advanced-monthly-weekday" ? prev.recurrenceAdvancedOrdinals : "",
    }));
  };

  const handleAdvancedWeekdayToggle = (code) => {
    setFormData((prev) => {
      const selected = fromCsv(prev.recurrenceAdvancedWeekdays);
      const next = selected.includes(code) ? selected.filter((item) => item !== code) : [...selected, code];
      const nextRRule = buildAdvancedMonthlyRRule(next, fromCsv(prev.recurrenceAdvancedOrdinals));
      return {
        ...prev,
        recurrenceAdvancedWeekdays: toCsv(next),
        recurrenceRRule: nextRRule,
      };
    });
  };

  const handleAdvancedOrdinalToggle = (ordinal) => {
    setFormData((prev) => {
      const selected = fromCsv(prev.recurrenceAdvancedOrdinals);
      const next = selected.includes(ordinal) ? selected.filter((item) => item !== ordinal) : [...selected, ordinal];
      const nextRRule = buildAdvancedMonthlyRRule(fromCsv(prev.recurrenceAdvancedWeekdays), next);
      return {
        ...prev,
        recurrenceAdvancedOrdinals: toCsv(next),
        recurrenceRRule: nextRRule,
      };
    });
  };

  const handleDanceStyleToggle = (style) => {
    setSelectedDanceStyles((prev) => {
      const next = prev.includes(style)
        ? prev.filter((item) => item !== style)
        : [...prev, style];

      setFormData((current) => ({
        ...current,
        danceStyle: next.join(", "),
      }));

      return next;
    });
  };

  const handleEventTypeToggle = (type) => {
    setSelectedEventTypes((prev) => {
      const next = prev.includes(type)
        ? prev.filter((item) => item !== type)
        : [...prev, type];

      setFormData((current) => ({
        ...current,
        eventType: next.join(", "),
      }));

      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const nextErrors = {
      eventName: "",
      location: "",
      date: "",
      recurring: "",
      recurrencePreset: "",
      recurrenceAdvanced: "",
      recurrenceDetails: "",
      startTime: "",
      endTime: "",
      description: "",
      eventType: "",
      danceStyle: "",
      flyer: "",
      safetyPolicyFile: "",
      safetyPolicyUrl: "",
      organizerFirstName: "",
      organizerLastName: "",
      organizerPhone: "",
      organizerFacebookPage: "",
      officialEventLink: "",
      contactSafetyPolicyFile: "",
      contactSafetyPolicyUrl: "",
    };
    if (!formData.eventName.trim()) nextErrors.eventName = "Event name is required.";
    if (!formData.location.trim()) nextErrors.location = "Location is required.";
    if (!formData.date.trim()) nextErrors.date = "Date is required.";

    if (!formData.recurring) {
      nextErrors.recurring = "Please select Yes or No for recurring.";
    }

    if (formData.recurring === "Yes") {
      if (!formData.recurrencePreset) {
        nextErrors.recurrencePreset = "Please select a recurrence pattern.";
      } else if (formData.recurrencePreset === "advanced-monthly-weekday") {
        if (selectedAdvancedOrdinals.length === 0 || selectedAdvancedWeekdays.length === 0) {
          nextErrors.recurrenceAdvanced = "Please select at least one week and one weekday.";
        }
      } else if (formData.recurrencePreset === "custom" && !formData.recurrenceDetails.trim()) {
        nextErrors.recurrenceDetails = "Please describe the recurrence details.";
      }
    }

    if (!formData.startTime) nextErrors.startTime = "Start time is required.";
    if (!formData.endTime) nextErrors.endTime = "End time is required.";
    if (!formData.description.trim()) nextErrors.description = "Description is required.";
    if (selectedEventTypes.length === 0) nextErrors.eventType = "Please select at least one event type.";
    if (selectedDanceStyles.length === 0) nextErrors.danceStyle = "Please select at least one dance style.";

    if (!formData.officialEventLink.trim()) {
      nextErrors.officialEventLink = "Official event link is required.";
    } else if (!isValidHttpUrl(formData.officialEventLink)) {
      nextErrors.officialEventLink = "Official event link must start with http:// or https://";
    }

    if (!flyerFile) {
      nextErrors.flyer = "Flyer is required.";
    }

    if (!formData.organizerFirstName.trim()) nextErrors.organizerFirstName = "First name is required.";
    if (!formData.organizerLastName.trim()) nextErrors.organizerLastName = "Last name is required.";
    if (!formData.organizerPhone.trim()) {
      nextErrors.organizerPhone = "Phone number is required.";
    } else if (!isValidPhoneNumber(formData.organizerPhone)) {
      nextErrors.organizerPhone = "Please enter a valid phone number.";
    }

    if (formData.organizerFacebookPage && !isValidFacebookUrl(formData.organizerFacebookPage)) {
      nextErrors.organizerFacebookPage = "Facebook page URL must be a valid facebook.com link (http/https).";
    }
    if (flyerFile && !isValidImageFile(flyerFile)) {
      nextErrors.flyer = "Flyer must be a valid image file (PNG, JPG/JPEG, HEIC/HEIF, or WEBP).";
    }
    if (safetyPolicyFile && !isValidImageFile(safetyPolicyFile)) {
      nextErrors.safetyPolicyFile = "Safety policy image must be PNG, JPG/JPEG, HEIC/HEIF, or WEBP.";
    }
    if (formData.safetyPolicyUrl && !isValidHttpUrl(formData.safetyPolicyUrl)) {
      nextErrors.safetyPolicyUrl = "Safety policy URL must start with http:// or https://";
    }
    if (contactSafetyPolicyFile && !isValidImageFile(contactSafetyPolicyFile)) {
      nextErrors.contactSafetyPolicyFile = "Safety policy image must be PNG, JPG/JPEG, HEIC/HEIF, or WEBP.";
    }
    if (formData.contactSafetyPolicyUrl && !isValidHttpUrl(formData.contactSafetyPolicyUrl)) {
      nextErrors.contactSafetyPolicyUrl = "Safety policy URL must start with http:// or https://";
    }

    setFormErrors(nextErrors);
    if (
      nextErrors.eventName ||
      nextErrors.location ||
      nextErrors.date ||
      nextErrors.recurring ||
      nextErrors.recurrencePreset ||
      nextErrors.recurrenceAdvanced ||
      nextErrors.recurrenceDetails ||
      nextErrors.startTime ||
      nextErrors.endTime ||
      nextErrors.description ||
      nextErrors.eventType ||
      nextErrors.danceStyle ||
      nextErrors.flyer ||
      nextErrors.safetyPolicyFile ||
      nextErrors.safetyPolicyUrl ||
      nextErrors.organizerFirstName ||
      nextErrors.organizerLastName ||
      nextErrors.organizerPhone ||
      nextErrors.organizerFacebookPage ||
      nextErrors.officialEventLink ||
      nextErrors.contactSafetyPolicyFile ||
      nextErrors.contactSafetyPolicyUrl
    ) {
      return;
    }

    const selectedOrganizer = organizers.find((org) => org.id === formData.organizerId);
    const organizerFullName = `${formData.organizerFirstName || ""} ${formData.organizerLastName || ""}`.trim();
    console.log("Submit Event form (placeholder):", {
      ...formData,
      organizerName: selectedOrganizer?.name || organizerFullName,
      flyerFileName: flyerFile?.name || "",
      safetyPolicyFileName: safetyPolicyFile?.name || "",
    });
    setSubmitted(true);
  };

  const handleFlyerFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFlyerFile(file);
    setFormErrors((prev) => ({
      ...prev,
      flyer: file && !isValidImageFile(file)
        ? "Flyer must be a valid image file (PNG, JPG/JPEG, HEIC/HEIF, or WEBP)."
        : "",
    }));
  };

  const handleSafetyPolicyFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setSafetyPolicyFile(file);
    setFormErrors((prev) => ({
      ...prev,
      safetyPolicyFile: file && !isValidImageFile(file)
        ? "Safety policy image must be PNG, JPG/JPEG, HEIC/HEIF, or WEBP."
        : "",
    }));
  };

  const handleContactSafetyPolicyFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setContactSafetyPolicyFile(file);
    setFormErrors((prev) => ({
      ...prev,
      contactSafetyPolicyFile: file && !isValidImageFile(file)
        ? "Safety policy image must be PNG, JPG/JPEG, HEIC/HEIF, or WEBP."
        : "",
    }));
  };

  const handleOrganizerInput = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      organizerFirstName: value,
      organizerId: "",
    }));
    setShowOrganizerSuggestions(true);
  };

  const handleOrganizerPick = (organizer) => {
    const { firstName, lastName } = splitOrganizerName(organizer.name);
    setFormData((prev) => ({
      ...prev,
      organizerFirstName: firstName,
      organizerLastName: lastName,
      organizerId: organizer.id,
    }));
    setShowOrganizerSuggestions(false);
  };

  const applyEventPrefill = (eventRecord) => {
    const eventData = eventRecord?.data || {};

    const organizerId = eventData.organizer_id || "";
    const matchedOrganizer = organizerId ? organizers.find((org) => org.id === organizerId) : null;

    const incomingDate =
      eventData.date || eventData.event_date || eventData.start_date || eventData.start || eventData.startTime;
    const isoDate = parseAnyDateToIso(incomingDate);
    const formattedDate = isoDate ? toDdMmYyyy(isoDate) : "";

    const incomingStartTime = eventData.start_time || eventData.startTime || eventData.start || "";
    const incomingEndTime = eventData.end_time || eventData.endTime || eventData.end || "";
    const parsedStart = parseTimeToParts(incomingStartTime);
    const parsedEnd = parseTimeToParts(incomingEndTime);
    const parsedDanceStyles = parseDanceStyles(eventData.dance_styles || eventData.dance_style || "");
    const rawEventTypes = parseDanceStyles(eventData.event_type || eventData.type || "");
    const normalizedEventTypes = rawEventTypes
      .map((value) => baseEventTypeOptions.find((option) => option.toLowerCase() === value.toLowerCase()) || null)
      .filter(Boolean);
    const hasUnknownEventType = rawEventTypes.some(
      (value) => !baseEventTypeOptions.some((option) => option.toLowerCase() === value.toLowerCase())
    );
    const parsedEventTypes = hasUnknownEventType
      ? [...new Set([...normalizedEventTypes, "Other"])]
      : [...new Set(normalizedEventTypes)];
    const recurringRaw = eventData.recurring;
    const derivedRecurringValue =
      typeof recurringRaw === "boolean"
        ? (recurringRaw ? "Yes" : "No")
        : String(recurringRaw || "").trim();
    const normalizedRecurring =
      derivedRecurringValue.toLowerCase() === "yes" || derivedRecurringValue.toLowerCase() === "true"
        ? "Yes"
        : derivedRecurringValue.toLowerCase() === "no" || derivedRecurringValue.toLowerCase() === "false"
          ? "No"
          : "";
    const incomingRRule =
      String(eventData.recurrence_rrule || eventData.rrule || eventData.recurrence_rule || "").trim();
    const matchedPreset = recurrencePresetOptions.find((option) => option.rrule && option.rrule === incomingRRule);
    const byDayMatch = incomingRRule.match(/BYDAY=([^;]+)/i);
    const bySetPosMatch = incomingRRule.match(/BYSETPOS=([^;]+)/i);
    const advancedWeekdaysFromRule = byDayMatch
      ? byDayMatch[1].split(",").map((item) => item.trim()).filter(Boolean)
      : [];
    const advancedOrdinalsFromRule = bySetPosMatch
      ? bySetPosMatch[1].split(",").map((item) => item.trim()).filter(Boolean)
      : [];
    const hasAdvancedMonthlyPattern = advancedWeekdaysFromRule.length > 0 && advancedOrdinalsFromRule.length > 0;
    const prefillOrganizerName =
      matchedOrganizer?.name ||
      eventData.organizer_name ||
      eventData.organizer ||
      `${eventData.organizer_first_name || ""} ${eventData.organizer_last_name || ""}`.trim();
    const splitPrefillOrganizer = splitOrganizerName(prefillOrganizerName);

    setFormData((prev) => ({
      ...prev,
      eventName: eventRecord.name,
      organizerId,
      organizerFirstName: splitPrefillOrganizer.firstName || prev.organizerFirstName,
      organizerLastName: splitPrefillOrganizer.lastName || prev.organizerLastName,
      location: eventData.location || eventData.venue || eventData.address || prev.location,
      date: formattedDate || prev.date,
      recurring: normalizedRecurring || (incomingRRule ? "Yes" : prev.recurring),
      recurrencePreset: incomingRRule
        ? (matchedPreset?.value || (hasAdvancedMonthlyPattern ? "advanced-monthly-weekday" : "custom"))
        : prev.recurrencePreset,
      recurrenceRRule: incomingRRule || prev.recurrenceRRule,
      recurrenceDetails:
        eventData.recurrence_details ||
        (incomingRRule && !matchedPreset ? "Imported custom recurring pattern" : prev.recurrenceDetails),
      recurrenceAdvancedWeekdays: hasAdvancedMonthlyPattern
        ? toCsv(advancedWeekdaysFromRule)
        : prev.recurrenceAdvancedWeekdays,
      recurrenceAdvancedOrdinals: hasAdvancedMonthlyPattern
        ? toCsv(advancedOrdinalsFromRule)
        : prev.recurrenceAdvancedOrdinals,
      startTime: incomingStartTime ? formatTimeFromParts(parsedStart) : prev.startTime,
      endTime: incomingEndTime ? formatTimeFromParts(parsedEnd) : prev.endTime,
      danceStyle: parsedDanceStyles.length > 0 ? parsedDanceStyles.join(", ") : prev.danceStyle,
      eventType: parsedEventTypes.length > 0 ? parsedEventTypes.join(", ") : prev.eventType,
      officialEventLink:
        eventData.official_event_link ||
        eventData.event_link ||
        (isValidHttpUrl(eventData.link) ? eventData.link : prev.officialEventLink),
      safetyPolicyUrl:
        eventData.safety_policy_url ||
        (isValidHttpUrl(eventData.safety_policy) ? eventData.safety_policy : prev.safetyPolicyUrl),
    }));

    setDatePickerValue(isoDate || "");
    setStartTimeParts(parsedStart);
    setEndTimeParts(parsedEnd);
    setSelectedDanceStyles(parsedDanceStyles);
    setSelectedEventTypes(parsedEventTypes);
    setSelectedEventRecord(eventRecord);
  };

  const handleEventNameInput = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, eventName: value }));
    setShowEventSuggestions(Boolean(value.trim()));

    const exactMatch = eventSuggestions.find(
      (item) => item.name.toLowerCase() === value.trim().toLowerCase()
    );

    if (exactMatch) {
      applyEventPrefill(exactMatch);
    }

    setSelectedEventRecord(null);
  };

  const handleEventNamePick = (eventRecord) => {
    applyEventPrefill(eventRecord);
    setShowEventSuggestions(false);
  };

  const selectedAdvancedWeekdays = fromCsv(formData.recurrenceAdvancedWeekdays);
  const selectedAdvancedOrdinals = fromCsv(formData.recurrenceAdvancedOrdinals);
  const advancedSummary = buildAdvancedSummary(selectedAdvancedWeekdays, selectedAdvancedOrdinals);

  return (
    <div style={{ padding: "20px", backgroundColor: "#02008f", minHeight: "100vh" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "20px",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <img src={danceLogo} alt="Dance Calendar Logo" style={{ height: "clamp(80px, 20vw, 160px)" }} />
        <button
          type="button"
          onClick={() => (window.location.href = "/")}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Back to Calendar
        </button>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >
        <h1 style={{ marginTop: 0, fontSize: "28px" }}>Submit an Event</h1>
        <p style={{ marginTop: 0, color: "#555" }}>
          Barebones form (placeholder). Submission currently logs to console only.
        </p>

        <form onSubmit={handleSubmit}>
          <div ref={eventFieldRef} style={{ marginBottom: "12px", position: "relative" }}>
            <label htmlFor="eventName" style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
              Event Name
            </label>
            <p style={{ margin: "0 0 6px", color: "#666", fontSize: "12px" }}>
              Type any name, or pick a suggested event.
            </p>
            <input
              id="eventName"
              name="eventName"
              type="text"
              required
              value={formData.eventName}
              onChange={handleEventNameInput}
              placeholder={isLoadingEventNames ? "Loading events..." : "Type or select event name"}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />

            {!isLoadingEventNames && showEventSuggestions && filteredEventNames.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "white",
                  border: "1px solid #ccc",
                  borderTop: "none",
                  borderRadius: "0 0 6px 6px",
                  maxHeight: "220px",
                  overflowY: "auto",
                  zIndex: 11,
                }}
              >
                {filteredEventNames.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleEventNamePick(item)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px",
                      border: "none",
                      borderBottom: "1px solid #f0f0f0",
                      background: "white",
                      cursor: "pointer",
                      borderRadius: 0,
                    }}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}
            {formErrors.eventName && (
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#c62828" }}>{formErrors.eventName}</p>
            )}
          </div>

          {[
            ["location", "Location"],
            ["date", "Date"],
          ].map(([name, label]) => (
            <div key={name} style={{ marginBottom: "12px" }}>
              <label htmlFor={name} style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
                {label}
              </label>
              {name === "location" && (
                <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#666", fontStyle: "italic" }}>
                  Suggested format: Venue Name A (123 Example St., St. Louis MO 12345)
                </p>
              )}
              {name === "date" && (
                <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#666", fontStyle: "italic" }}>
                  Pick a date from the calendar. It will auto-convert to DD/MM/YYYY.
                </p>
              )}
              {name === "date" ? (
                <>
                  <input
                    id={name}
                    name={name}
                    type="date"
                    required
                    value={datePickerValue}
                    onChange={handleDateChange}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      boxSizing: "border-box",
                    }}
                  />
                  {formData.date && (
                    <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#666", fontStyle: "italic" }}>
                      Converted date: {formData.date}
                    </p>
                  )}
                </>
              ) : (
                <input
                  id={name}
                  name={name}
                  type="text"
                  required={name !== "location" ? undefined : true}
                  value={formData[name]}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                  }}
                />
              )}
              {name === "location" && formErrors.location && (
                <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#c62828" }}>{formErrors.location}</p>
              )}
              {name === "date" && formErrors.date && (
                <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#c62828" }}>{formErrors.date}</p>
              )}
            </div>
          ))}

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
              Recurring?
            </label>
            <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="checkbox"
                  checked={formData.recurring === "Yes"}
                  onChange={() => handleRecurringToggle("Yes")}
                />
                Yes
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="checkbox"
                  checked={formData.recurring === "No"}
                  onChange={() => handleRecurringToggle("No")}
                />
                No
              </label>
            </div>
            {formErrors.recurring && (
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#c62828" }}>{formErrors.recurring}</p>
            )}

            {formData.recurring === "Yes" && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  backgroundColor: "#fafafa",
                }}
              >
                <label htmlFor="recurrencePreset" style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
                  How often does this repeat?
                </label>
                <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#666", fontStyle: "italic" }}>
                  Start simple, or pick advanced for combinations like first, second, and fourth Friday.
                </p>
                <select
                  id="recurrencePreset"
                  name="recurrencePreset"
                  value={formData.recurrencePreset}
                  onChange={handleRecurrencePresetChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Select a pattern</option>
                  {recurrencePresetOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {formErrors.recurrencePreset && (
                  <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#c62828" }}>{formErrors.recurrencePreset}</p>
                )}

                {formData.recurrencePreset === "advanced-monthly-weekday" && (
                  <>
                    <label style={{ display: "block", fontWeight: 600, margin: "10px 0 4px" }}>
                      Which week(s) of the month?
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                      {advancedOrdinalOptions.map((option) => (
                        <label key={option.value} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <input
                            type="checkbox"
                            checked={selectedAdvancedOrdinals.includes(option.value)}
                            onChange={() => handleAdvancedOrdinalToggle(option.value)}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>

                    <label style={{ display: "block", fontWeight: 600, margin: "10px 0 4px" }}>
                      Which day(s) of the week?
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                      {advancedWeekdayOptions.map((option) => (
                        <label key={option.value} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <input
                            type="checkbox"
                            checked={selectedAdvancedWeekdays.includes(option.value)}
                            onChange={() => handleAdvancedWeekdayToggle(option.value)}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>

                    {advancedSummary && (
                      <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#0b3d91", fontWeight: 600 }}>
                        Pattern: {advancedSummary}
                      </p>
                    )}
                    {formErrors.recurrenceAdvanced && (
                      <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#c62828" }}>{formErrors.recurrenceAdvanced}</p>
                    )}
                  </>
                )}

                {formData.recurrencePreset === "custom" && (
                  <>
                    <label
                      htmlFor="recurrenceDetails"
                      style={{ display: "block", fontWeight: 600, margin: "10px 0 4px" }}
                    >
                      Repeat details
                    </label>
                    <input
                      id="recurrenceDetails"
                      name="recurrenceDetails"
                      type="text"
                      value={formData.recurrenceDetails}
                      onChange={handleChange}
                      placeholder="Example: Every first and third Wednesday"
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        boxSizing: "border-box",
                      }}
                    />
                    <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#666", fontStyle: "italic" }}>
                      Write this in plain language. We'll convert it behind the scenes.
                    </p>
                    {formErrors.recurrenceDetails && (
                      <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#c62828" }}>{formErrors.recurrenceDetails}</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
              Start Time
            </label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={startTimeParts.hour}
                onChange={(e) => handleTimePartChange("startTime", "hour", e.target.value)}
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
              >
                <option value="">HH</option>
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((hour) => (
                  <option key={hour} value={hour}>{hour}</option>
                ))}
              </select>

              <select
                value={startTimeParts.minute}
                onChange={(e) => handleTimePartChange("startTime", "minute", e.target.value)}
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
              >
                <option value="">MM</option>
                {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((minute) => (
                  <option key={minute} value={minute}>{minute}</option>
                ))}
              </select>

              <select
                value={startTimeParts.ampm}
                onChange={(e) => handleTimePartChange("startTime", "ampm", e.target.value)}
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
            {formErrors.startTime && (
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#c62828" }}>{formErrors.startTime}</p>
            )}
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
              End Time
            </label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={endTimeParts.hour}
                onChange={(e) => handleTimePartChange("endTime", "hour", e.target.value)}
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
              >
                <option value="">HH</option>
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((hour) => (
                  <option key={hour} value={hour}>{hour}</option>
                ))}
              </select>

              <select
                value={endTimeParts.minute}
                onChange={(e) => handleTimePartChange("endTime", "minute", e.target.value)}
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
              >
                <option value="">MM</option>
                {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((minute) => (
                  <option key={minute} value={minute}>{minute}</option>
                ))}
              </select>

              <select
                value={endTimeParts.ampm}
                onChange={(e) => handleTimePartChange("endTime", "ampm", e.target.value)}
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
            {formErrors.endTime && (
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#c62828" }}>{formErrors.endTime}</p>
            )}
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label htmlFor="description" style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
              Description
            </label>
            <input
              id="description"
              name="description"
              type="text"
              required
              value={formData.description}
              onChange={handleChange}
              placeholder="Here is my event information!"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />
            {formErrors.description && (
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#c62828" }}>{formErrors.description}</p>
            )}
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
              Event Type(s)
            </label>
            <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#666", fontStyle: "italic" }}>
              Select one or more.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {baseEventTypeOptions.map((type) => (
                <label key={type} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <input
                    type="checkbox"
                    checked={selectedEventTypes.includes(type)}
                    onChange={() => handleEventTypeToggle(type)}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
            {formErrors.eventType && (
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#c62828" }}>{formErrors.eventType}</p>
            )}
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
              Dance Style(s)
            </label>
            <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#666", fontStyle: "italic" }}>
              Select one or more.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {danceStyleOptions.map((style) => (
                <label key={style} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <input
                    type="checkbox"
                    checked={selectedDanceStyles.includes(style)}
                    onChange={() => handleDanceStyleToggle(style)}
                  />
                  <span>{style}</span>
                </label>
              ))}
            </div>
            {formErrors.danceStyle && (
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#c62828" }}>{formErrors.danceStyle}</p>
            )}
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label htmlFor="officialEventLink" style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
              Official Event Link
            </label>
            <input
              id="officialEventLink"
              name="officialEventLink"
              type="text"
              required
              placeholder="https://example.com/event"
              value={formData.officialEventLink}
              onChange={(e) => {
                handleChange(e);
                const value = e.target.value;
                setFormErrors((prev) => ({
                  ...prev,
                  officialEventLink: value && !isValidHttpUrl(value)
                    ? "Official event link must start with http:// or https://"
                    : "",
                }));
              }}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />
            {formErrors.officialEventLink && (
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#c62828" }}>{formErrors.officialEventLink}</p>
            )}
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label htmlFor="flyer" style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
              Flyer
            </label>
            <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#666", fontStyle: "italic" }}>
              {hasPriorFlyer
                ? "Please upload if DIFFERENT from prior event."
                : "Upload image (PNG, JPG/JPEG, HEIC/HEIF, or WEBP)."}
            </p>
            <input
              id="flyer"
              name="flyer"
              type="file"
              required
              accept=".png,.jpg,.jpeg,.heic,.heif,.webp,image/png,image/jpeg,image/heic,image/heif,image/webp"
              onChange={handleFlyerFileChange}
              style={{ width: "100%" }}
            />
            {formErrors.flyer && (
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#c62828" }}>{formErrors.flyer}</p>
            )}
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label htmlFor="safetyPolicyUrl" style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
              Safety Policy
            </label>
            <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#666", fontStyle: "italic" }}>
              (ONLY ADD HERE IF UNIQUE FOR THIS EVENT AND NOT CONSISTENT FOR CONTACT)
            </p>
            <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#666", fontStyle: "italic" }}>
              {hasSelectedPriorEvent || hasPriorSafetyPolicy
                ? "Please upload if DIFFERENT from prior event."
                : "Provide a website URL or upload an image."}
            </p>
            <input
              id="safetyPolicyUrl"
              name="safetyPolicyUrl"
              type="text"
              placeholder="https://example.com/safety-policy"
              value={formData.safetyPolicyUrl}
              onChange={(e) => {
                handleChange(e);
                const value = e.target.value;
                setFormErrors((prev) => ({
                  ...prev,
                  safetyPolicyUrl: value && !isValidHttpUrl(value)
                    ? "Safety policy URL must start with http:// or https://"
                    : "",
                }));
              }}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
                marginBottom: "8px",
              }}
            />
            {formErrors.safetyPolicyUrl && (
              <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#c62828" }}>{formErrors.safetyPolicyUrl}</p>
            )}

            <input
              id="safetyPolicyFile"
              name="safetyPolicyFile"
              type="file"
              accept=".png,.jpg,.jpeg,.heic,.heif,.webp,image/png,image/jpeg,image/heic,image/heif,image/webp"
              onChange={handleSafetyPolicyFileChange}
              style={{ width: "100%" }}
            />
            {formErrors.safetyPolicyFile && (
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#c62828" }}>{formErrors.safetyPolicyFile}</p>
            )}
          </div>

          <div style={{ position: "relative", margin: "24px 0 16px", textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #d9d9d9" }} />
            <span
              style={{
                position: "relative",
                top: "-12px",
                display: "inline-block",
                padding: "0 10px",
                backgroundColor: "white",
                color: "#666",
                fontWeight: 700,
                fontSize: "14px",
                letterSpacing: "0.2px",
              }}
            >
              Contact Info
            </span>
          </div>

          <div ref={organizerFieldRef} style={{ marginBottom: "12px", position: "relative" }}>
            <label htmlFor="organizerFirstName" style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
              Organizer/Submitter First Name
            </label>
            <p style={{ margin: "0 0 6px", color: "#666", fontSize: "12px" }}>
              Type any name, or pick a suggested organizer.
            </p>
            <input
              id="organizerFirstName"
              name="organizerFirstName"
              type="text"
              required
              value={formData.organizerFirstName}
              onChange={handleOrganizerInput}
              onFocus={() => setShowOrganizerSuggestions(true)}
              placeholder={isLoadingOrganizers ? "Loading organizers..." : "Type first name or select organizer"}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />

            {!isLoadingOrganizers && showOrganizerSuggestions && filteredOrganizers.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "white",
                  border: "1px solid #ccc",
                  borderTop: "none",
                  borderRadius: "0 0 6px 6px",
                  maxHeight: "220px",
                  overflowY: "auto",
                  zIndex: 10,
                }}
              >
                {filteredOrganizers.map((organizer) => (
                  <button
                    key={organizer.id}
                    type="button"
                    onClick={() => handleOrganizerPick(organizer)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px",
                      border: "none",
                      borderBottom: "1px solid #f0f0f0",
                      background: "white",
                      cursor: "pointer",
                      borderRadius: 0,
                    }}
                  >
                    {organizer.name}
                  </button>
                ))}
              </div>
            )}
            {formErrors.organizerFirstName && (
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#c62828" }}>{formErrors.organizerFirstName}</p>
            )}
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label htmlFor="organizerLastName" style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
              Organizer/Submitter Last Name
            </label>
            <input
              id="organizerLastName"
              name="organizerLastName"
              type="text"
              required
              value={formData.organizerLastName}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />
            {formErrors.organizerLastName && (
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#c62828" }}>{formErrors.organizerLastName}</p>
            )}
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label htmlFor="contactSafetyPolicyCompanyName" style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
              Company Name (If Exists)
            </label>
            <input
              id="contactSafetyPolicyCompanyName"
              name="contactSafetyPolicyCompanyName"
              type="text"
              value={formData.contactSafetyPolicyCompanyName}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label htmlFor="organizerPhone" style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
              Organizer's Phone Number
            </label>
            <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#666", fontStyle: "italic" }}>
              For form contact purposes only if additional information is needed.
            </p>
            <input
              id="organizerPhone"
              name="organizerPhone"
              type="tel"
              required
              value={formData.organizerPhone}
              onChange={(e) => {
                handleChange(e);
                const value = e.target.value;
                setFormErrors((prev) => ({
                  ...prev,
                  organizerPhone: value && !isValidPhoneNumber(value)
                    ? "Please enter a valid phone number."
                    : "",
                }));
              }}
              placeholder="(555) 555-5555"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />
            {formErrors.organizerPhone && (
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#c62828" }}>{formErrors.organizerPhone}</p>
            )}
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label htmlFor="organizerInstagramHandle" style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
              Instagram Handle (Optional)
            </label>
            <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#666", fontStyle: "italic" }}>
              Add up to 2, with a comma to separate them i.e. '@handle1, @handle2'
            </p>
            <input
              id="organizerInstagramHandle"
              name="organizerInstagramHandle"
              type="text"
              value={formData.organizerInstagramHandle}
              onChange={handleChange}
              placeholder="@handle1, @handle2"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label htmlFor="organizerFacebookPage" style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
              Organizer Facebook Page (Optional)
            </label>
            <input
              id="organizerFacebookPage"
              name="organizerFacebookPage"
              type="text"
              value={formData.organizerFacebookPage}
              onChange={(e) => {
                handleChange(e);
                const value = e.target.value;
                setFormErrors((prev) => ({
                  ...prev,
                  organizerFacebookPage: value && !isValidFacebookUrl(value)
                    ? "Facebook page URL must be a valid facebook.com link (http/https)."
                    : "",
                }));
              }}
              placeholder="https://facebook.com/your-page"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />
            {formErrors.organizerFacebookPage && (
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#c62828" }}>{formErrors.organizerFacebookPage}</p>
            )}
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label htmlFor="contactSafetyPolicyUrl" style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
              Safety Policy (Highly Recommended)
            </label>
            <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#666", fontStyle: "italic" }}>
              Please provide a Safety Policy if you have one.
              <br />
              Want one but don't know where to start? Check out one created by peer organizers: (PLACEHOLDER)[].
            </p>
            <input
              id="contactSafetyPolicyUrl"
              name="contactSafetyPolicyUrl"
              type="text"
              placeholder="https://example.com/safety-policy"
              value={formData.contactSafetyPolicyUrl}
              onChange={(e) => {
                handleChange(e);
                const value = e.target.value;
                setFormErrors((prev) => ({
                  ...prev,
                  contactSafetyPolicyUrl: value && !isValidHttpUrl(value)
                    ? "URL must start with http:// or https://"
                    : "",
                }));
              }}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
                marginBottom: "8px",
              }}
            />
            {formErrors.contactSafetyPolicyUrl && (
              <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#c62828" }}>{formErrors.contactSafetyPolicyUrl}</p>
            )}

            <input
              id="contactSafetyPolicyFile"
              name="contactSafetyPolicyFile"
              type="file"
              accept=".png,.jpg,.jpeg,.heic,.heif,.webp,image/png,image/jpeg,image/heic,image/heif,image/webp"
              onChange={handleContactSafetyPolicyFileChange}
              style={{ width: "100%" }}
            />
            {formErrors.contactSafetyPolicyFile && (
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#c62828" }}>{formErrors.contactSafetyPolicyFile}</p>
            )}
          </div>

          <button
            type="submit"
            style={{
              marginTop: "8px",
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Submit
          </button>
        </form>

        {submitted && (
          <p style={{ marginTop: "12px", color: "#2e7d32", fontWeight: 600 }}>
            Form submitted for review. (placeholder behavior).
          </p>
        )}
      </div>
    </div>
  );
}
