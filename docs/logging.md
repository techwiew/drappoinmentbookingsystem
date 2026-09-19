# API logging

The backend writes one JSON line when an HTTP request starts and one when it completes. The response includes an `X-Request-Id` header. Clients may send a safe alphanumeric `X-Request-Id` to correlate their request; otherwise the server generates one.

Example successful appointment request:

```json
{"timestamp":"2026-09-19T09:00:00.000Z","level":"info","event":"http.request.started","requestId":"example-123","method":"POST","path":"/api/appointments"}
{"timestamp":"2026-09-19T09:00:00.100Z","level":"info","event":"appointment.created","requestId":"example-123","clinicId":"clinic-id","userId":"user-id","role":"RECEPTIONIST","appointmentId":"appointment-id","doctorId":"doctor-id","appointmentDate":"2026-09-19","appointmentTime":"02:00 PM","status":"BOOKED"}
{"timestamp":"2026-09-19T09:00:00.102Z","level":"info","event":"http.request.completed","requestId":"example-123","method":"POST","path":"/api/appointments/","statusCode":201,"durationMs":102,"clinicId":"clinic-id","userId":"user-id","role":"RECEPTIONIST"}
```

Failed requests log `http.request.failed` with an error code and a completion line with HTTP status and duration. Validation and authentication failures that return directly still produce the completion line and error code. The request ID is the quickest way to find all entries for one request.

Workflow events include appointment creation/listing, queue views and doctor handoff, consultation start/completion, clinic profile updates, reports views, admission/payment/discharge, OPD payment, and doctor/receptionist creation. Existing database audit records continue to record business actions.

Request bodies, query strings, passwords, tokens, patient names, medical notes, and payment amounts are not printed in these logs. Log output goes to the backend process standard output/error, so collection and retention depend on the deployment host.
