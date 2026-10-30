import request from "supertest";
import { test, expect, beforeAll, afterEach, afterAll } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Slot from "../src/models/Slot.js";
import Booking from "../src/models/Booking.js";
import bcrypt from "bcryptjs";

let mongo;
let userToken;
let providerToken;
let userId;
let providerId;
let slotId;

const register = async (name, email, role = "user") => request(app)
  .post("/api/auth/register")
  .send({ name, email, password: "Password123!", role });

beforeAll(async () => {
  process.env.JWT_SECRET = "test_secret_that_is_at_least_32_characters_long";
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  await Promise.all([User.deleteMany({}), Slot.deleteMany({}), Booking.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test("health endpoint responds", async () => {
  const res = await request(app).get("/health");
  expect(res.status).toBe(200);
  expect(res.body.status).toBe("ok");
});

test("registers users and rejects duplicate emails", async () => {
  const first = await register("Test User", "user@example.com");
  expect(first.status).toBe(201);
  expect(first.body.token).toBeTruthy();
  const second = await register("Test User", "user@example.com");
  expect(second.status).toBe(409);
});

test("provider can create slot and user can book only once", async () => {
  const provider = await register("Test Provider", "provider@example.com", "provider");
  const user = await register("Test User", "user@example.com", "user");
  providerToken = provider.body.token;
  userToken = user.body.token;
  providerId = provider.body.user.id;
  userId = user.body.user.id;

  const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);
  const created = await request(app).post("/api/slots")
    .set("Authorization", `Bearer ${providerToken}`)
    .send({ startAt: startAt.toISOString(), endAt: endAt.toISOString() });
  expect(created.status).toBe(201);
  slotId = created.body.slot._id;

  const wrongRole = await request(app).post("/api/slots")
    .set("Authorization", `Bearer ${userToken}`)
    .send({ startAt: startAt.toISOString(), endAt: endAt.toISOString() });
  expect(wrongRole.status).toBe(403);

  const booked = await request(app).post("/api/bookings")
    .set("Authorization", `Bearer ${userToken}`).send({ slotId });
  expect(booked.status).toBe(201);

  const second = await request(app).post("/api/bookings")
    .set("Authorization", `Bearer ${userToken}`).send({ slotId });
  expect(second.status).toBe(409);
});

test("cancelling a booking frees the slot", async () => {
  const provider = await register("Provider", "provider2@example.com", "provider");
  const user = await register("User", "user2@example.com");
  const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);
  const slotRes = await request(app).post("/api/slots")
    .set("Authorization", `Bearer ${provider.body.token}`)
    .send({ startAt: startAt.toISOString(), endAt: endAt.toISOString() });
  const bookingRes = await request(app).post("/api/bookings")
    .set("Authorization", `Bearer ${user.body.token}`)
    .send({ slotId: slotRes.body.slot._id });

  const cancelRes = await request(app).patch(`/api/bookings/${bookingRes.body.booking._id}/cancel`)
    .set("Authorization", `Bearer ${user.body.token}`);
  expect(cancelRes.status).toBe(200);

  const available = await request(app).get("/api/slots");
  expect(available.body.slots.some(s => s._id === slotRes.body.slot._id)).toBe(true);
});
