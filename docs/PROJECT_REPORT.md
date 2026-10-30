# SapphireIQ Appointment Booking API — Project Report

## 1. Abstract
The SapphireIQ Appointment Booking API is a REST backend that lets service providers publish future appointment slots and lets registered users book or cancel them. It uses Node.js and Express for HTTP routes, MongoDB/Mongoose for data storage, JWT for authentication, and role-based middleware for authorization.

## 2. Problem statement
Manual appointment scheduling can cause duplicate bookings, unclear availability, and inconsistent cancellation records. This API centralizes availability and booking rules and rejects requests that conflict with an existing booking.

## 3. Objectives
- Implement registration and login with hashed passwords.
- Protect private endpoints with JWT.
- Separate user and provider permissions.
- Create and list future appointment slots.
- Book and cancel slots.
- Prevent duplicate active bookings.
- Validate request data and return predictable errors.
- Verify core flows with automated tests.

## 4. Technology stack
- Runtime: Node.js
- Server: Express
- Database/ODM: MongoDB and Mongoose
- Authentication: JSON Web Token (JWT), bcryptjs
- Validation: Zod
- Tests: Jest, Supertest, mongodb-memory-server
- Deployment: Render Web Service and MongoDB Atlas

## 5. Architecture
Client/Postman sends HTTP requests to Express routes. Authentication middleware verifies JWTs. Role middleware checks user/provider access. Route handlers validate input and execute Mongoose operations. MongoDB stores users, slots and bookings; atomic slot updates and a partial unique index protect against active double bookings.

## 6. Data models
- User: name, unique email, password hash, role.
- Slot: provider reference, start time, end time, booking availability.
- Booking: slot, user, provider, status (`booked` or `cancelled`).

## 7. Main API routes
See the route table in the root README.md. Core groups are `/api/auth`, `/api/slots`, and `/api/bookings`.

## 8. Validation and security
Passwords are hashed before storage. JWTs are required for protected routes. Provider-only slot creation is enforced by role middleware. Request bodies are validated with Zod; Helmet, CORS and rate limiting are enabled. Secrets are configured using environment variables.

## 9. Testing plan
Run `npm test`. The tests cover health checks, registration and duplicate email handling, role restrictions, booking conflicts and cancellation. Also manually verify all endpoints in Postman.

## 10. Deployment
Deploy the GitHub repository as a Render Web Service and connect it to MongoDB Atlas. Set `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_ORIGIN`, and `NODE_ENV` in the hosting dashboard. Test the deployed `/health` route.

## 11. Conclusion
The project demonstrates REST API design, data modeling, JWT authentication, role-based authorization, validation, booking conflict prevention, integration testing and cloud deployment.

## 12. Future enhancements
Admin approval for providers, email reminders, calendar integration, payment support, pagination, API versioning, stronger audit logs, and a frontend booking dashboard.
