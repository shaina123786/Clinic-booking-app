# CareSlot - Clinic Appointment Booking API

This is my project for the Full Stack Developer Intern task. Clinics can publish time slots and patients can book them. I also made a small web page, so the API is easy to try without any extra tool.

## What it does

- Create, list and cancel slots
- Book and cancel bookings
- A slot can never be double booked, even if two requests come at the same moment
- Input is validated and the errors are easy to understand
- Automated tests for the booking rules

## Tech used

- Node.js and Express
- SQLite (sqlite3 package)
- Jest and Supertest for tests
- Plain HTML, CSS and JavaScript for the UI

## How to run

1. Clone the repo and go inside the folder

```
git clone https://github.com/shaina123786/Clinic-booking-app.git
cd Clinic-booking-app
```

2. Install the packages

```
npm install
```

3. Start the server

```
npm start
```

4. Open http://localhost:3000 in the browser

The database file `booking.db` is created automatically on the first run. The page has two tabs: "Book Appointment" for patients and "Clinic Dashboard" for clinics.

## How to run the tests

```
npm test
```

The tests use an in-memory database, so they do not touch the real data.

## Project structure

```
src
  app.js          creates the express app
  server.js       starts the server
  errors.js       custom error classes
  db              database connection and schema
  routes          connects urls to controllers
  controllers     reads the request and sends the response
  services        all the booking rules are here
  validators      checks the input
  middleware      error handling
public            the UI (html, css, js)
tests             all the tests
```

I kept the rules inside the services, so the routes and controllers stay small.

## API endpoints

| Method | Endpoint | What it does |
|---|---|---|
| POST | /slots | Create a slot |
| GET | /slots | List slots |
| GET | /slots/:id | Get one slot |
| DELETE | /slots/:id | Cancel a slot |
| POST | /bookings | Book a slot |
| GET | /bookings/:id | Get one booking |
| DELETE | /bookings/:id | Cancel a booking |

`GET /slots` also accepts these filters: `clinicName`, `date` (like 2026-12-01) and `state` (available, booked or cancelled).

A slot is shown with one of three states: `available`, `booked` or `cancelled`.

## Example requests

Create a slot

```
curl -X POST http://localhost:3000/slots -H "Content-Type: application/json" -d '{"clinicName":"City Care Clinic","slotDate":"2026-12-01","startTime":"10:00","endTime":"10:30"}'
```

Response (201)

```json
{
  "id": 1,
  "clinicName": "City Care Clinic",
  "slotDate": "2026-12-01",
  "startTime": "10:00",
  "endTime": "10:30",
  "state": "available",
  "bookingId": null,
  "patientName": null
}
```

List only the available slots

```
curl "http://localhost:3000/slots?state=available"
```

Book a slot

```
curl -X POST http://localhost:3000/bookings -H "Content-Type: application/json" -d '{"slotId":1,"patientName":"Ravi Kumar","patientEmail":"ravi@mail.com","patientPhone":"9876543210"}'
```

Response (201)

```json
{
  "id": 1,
  "slotId": 1,
  "patientName": "Ravi Kumar",
  "patientEmail": "ravi@mail.com",
  "patientPhone": "9876543210",
  "status": "confirmed",
  "createdAt": "2026-10-24 13:30:00"
}
```

Book the same slot again (409)

```json
{
  "error": {
    "code": "SLOT_ALREADY_BOOKED",
    "message": "This slot has already been booked",
    "details": []
  }
}
```

Cancel a booking

```
curl -X DELETE http://localhost:3000/bookings/1
```

Cancel a slot

```
curl -X DELETE http://localhost:3000/slots/1
```

On Windows PowerShell, use `curl.exe` instead of `curl`, or use `Invoke-RestMethod`.

## Error format

All errors look the same:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please fix the highlighted fields",
    "details": [
      { "field": "patientEmail", "message": "Please enter a valid email" }
    ]
  }
}
```

| Status | When |
|---|---|
| 400 | Invalid input. The details list shows which field is wrong |
| 404 | Slot or booking not found |
| 409 | Conflict, like slot already booked, slot cancelled or overlapping slot |

## How double booking is stopped

At first I thought of just checking "is this slot free?" in the code before saving. But if two requests come at the same time, both can pass that check. So I also added a partial unique index in the database:

```sql
CREATE UNIQUE INDEX one_confirmed_booking_per_slot
ON bookings (slot_id)
WHERE status = 'confirmed';
```

This means one slot can have only one confirmed booking. When two requests come together, the database accepts one and rejects the other, and the API sends 409. Cancelled bookings are not counted, so a slot can be booked again after a cancel.

In the booking service I do not check first. I directly try to insert, and if the database says it is a duplicate, I return the 409 error.

There is a test that sends 10 booking requests at the same moment and checks that only 1 succeeds and 9 get 409. Another test checks the database and confirms there is exactly one confirmed booking.

## Other rules I added

- End time must be after start time
- A slot cannot be created in the past
- Two slots of the same clinic cannot overlap
- A cancelled slot cannot be booked
- Cancelling a slot also cancels its confirmed booking
- Cancelling a booking keeps the row with status `cancelled`, so the history is not lost
- Cancelling something that is already cancelled gives a clear 409 error

## What I would add with more time

- Login for clinics and patients
- Pagination in the slot list
- Timezone handling
- Email confirmation after booking
- Docker setup