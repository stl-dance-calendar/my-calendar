Ordered Chronologically

feature/submission
- create Submit an Event form at localhost:5173/submit-an-event (done)
- clicking 'submit' stores all in Firebase under new 'submissions' (done)
- testing worst-case most-filled form saves successfully
- add security (create-only access for eventSubmissions, read/update/delete blocked for everyone, and whitelisted allowed fields) - for now
- status pending_review/reviewed/declined - confirm
- clicking 'submit' gives us completed message (done)
- failure has try again message (completed)
- clicking 'submit a request' leads us here (done)
- option to take us back to home (done)
- clean up the fields and cross reference to make sure names are clear and they match contacts and events from prior setup
- ensure image or link option for safety policy are separated
- add functionality with Firebase Cloud Function (validates data, writes to Firestore, sends email via Resend API, return success/failure to frontend)
- test on several emulator sizes

feature/hide
-hide the events which are created in gcal but without a 

feature/admin
- (after submission branch completed) display submissions on localhost:5173/temp-admin-submissions
- collect research and past trainings info: Secure Code Warrior etc in order to ensure cybersec standards are in place (to avoid: bots -> insane charges, folks who want to f with the system and compromise reliability of info)
- look into two-factor auth especially once email is set up
- create a flag for testing purposes for now: if testing=true then disable admin login
- create admin login (look into 2 factor with text)
- test on several emulator sizes

feature/publication
- when an event is submitted: saves to firebase appropriately, flag switches to publish and it's visible on site and on gcal as expected
- test on several emulator sizes

feature/cleanup
- add unit/integration testing including edge cases

feature/manual-testing-fixes
- scope includes creating a checklist, executing manual checks and flows for 3 phone, 1 ipad, 1 laptop device
- branch to create for any fixes that need to be made
- test hacking: XSS/html (don't allow certain characters or create whitelist if haven't done so),