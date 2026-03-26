const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

const results = [];
let failed = 0;

const logResult = (name, pass, details = "") => {
  results.push({ name, pass, details });
  if (!pass) failed += 1;
};

const expectStatus = (name, response, expected) => {
  const pass = response.status === expected;
  logResult(name, pass, `expected ${expected}, got ${response.status}`);
  return pass;
};

const readJsonSafe = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text };
  }
};

const request = async (method, path, body, token) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await readJsonSafe(response);
  return { response, json };
};

const randomSuffix = () => Math.floor(Date.now() / 1000).toString(36);

const run = async () => {
  const suffix = randomSuffix();
  const email = `charan_${suffix}@example.com`;
  const password = "123456";
  const username = `charan_${suffix}`;
  const vehicleNumber = `TS09${suffix.slice(-4).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;

  // Register user
  let { response, json } = await request("POST", "/api/auth/register", {
    username,
    email,
    password,
  });
  expectStatus("Auth register", response, 201);

  // Duplicate register should fail
  ({ response, json } = await request("POST", "/api/auth/register", {
    username,
    email,
    password,
  }));
  expectStatus("Auth duplicate register", response, 409);

  // Login success
  ({ response, json } = await request("POST", "/api/auth/login", {
    email,
    password,
  }));
  const loginOk = expectStatus("Auth login", response, 200);
  const token = loginOk ? json?.data?.token : null;
  const userId = loginOk ? json?.data?.userId : null;
  logResult("Auth token present", Boolean(token), "token should be set");
  logResult("Auth userId present", Boolean(userId), "userId should be set");

  // Login wrong password
  ({ response, json } = await request("POST", "/api/auth/login", {
    email,
    password: "wrong-pass",
  }));
  expectStatus("Auth wrong password", response, 400);

  // Unauthorized vehicles request
  ({ response, json } = await request("GET", "/api/vehicles"));
  expectStatus("Vehicles unauthorized", response, 401);

  // Add vehicle
  ({ response, json } = await request(
    "POST",
    "/api/vehicles",
    {
      vehicle_number: vehicleNumber,
      model: "Model X",
    },
    token
  ));
  const vehicleAddOk = expectStatus("Vehicles add", response, 201);
  const vehicleId = vehicleAddOk ? json?.id : null;
  logResult("Vehicles add id present", Boolean(vehicleId), "vehicle id should be set");

  // Duplicate vehicle number should fail
  ({ response, json } = await request(
    "POST",
    "/api/vehicles",
    {
      vehicle_number: vehicleNumber,
      model: "Model X",
    },
    token
  ));
  expectStatus("Vehicles duplicate add", response, 409);

  // Get user vehicles
  ({ response, json } = await request("GET", "/api/vehicles", null, token));
  const vehiclesOk = expectStatus("Vehicles list", response, 200);
  logResult("Vehicles list is array", Array.isArray(json), "vehicles response should be an array");

  // Areas
  ({ response, json } = await request("GET", "/api/slots/areas"));
  expectStatus("Slots areas", response, 200);
  logResult("Slots areas is array", Array.isArray(json), "areas response should be an array");

  // Slots by area
  ({ response, json } = await request("GET", "/api/slots/area/a"));
  const slotsOk = expectStatus("Slots by area", response, 200);
  logResult("Slots by area is array", Array.isArray(json), "slots response should be an array");
  const availableSlot = slotsOk && Array.isArray(json) ? json.find((s) => !s.is_occupied) : null;
  const slotId = availableSlot?.id;
  logResult("Available slot found", Boolean(slotId), "need at least one available slot in area a");

  // Booking validation error
  ({ response, json } = await request("POST", "/api/bookings", {}, token));
  expectStatus("Bookings validation missing ids", response, 400);

  // Book valid slot
  ({ response, json } = await request(
    "POST",
    "/api/bookings",
    {
      vehicle_id: vehicleId,
      slot_id: slotId,
    },
    token
  ));
  const bookingOk = expectStatus("Bookings create", response, 201);
  const bookingId = bookingOk ? json?.id : null;
  logResult("Bookings id present", Boolean(bookingId), "booking id should be set");

  // Booking with same vehicle should fail while active
  ({ response, json } = await request(
    "POST",
    "/api/bookings",
    {
      vehicle_id: vehicleId,
      slot_id: slotId,
    },
    token
  ));
  expectStatus("Bookings duplicate active vehicle", response, 400);

  // Active booking
  ({ response, json } = await request("GET", "/api/bookings/active", null, token));
  expectStatus("Bookings active", response, 200);

  // Booking by id
  ({ response, json } = await request("GET", `/api/bookings/${bookingId}`, null, token));
  expectStatus("Bookings by id", response, 200);

  // Exit with invalid booking id should fail
  ({ response, json } = await request(
    "POST",
    "/api/bookings/exit",
    { booking_id: 99999999 },
    token
  ));
  expectStatus("Bookings exit invalid id", response, 404);

  // Exit active booking
  ({ response, json } = await request(
    "POST",
    "/api/bookings/exit",
    { booking_id: bookingId },
    token
  ));
  expectStatus("Bookings exit", response, 200);

  // Active booking should now be null
  ({ response, json } = await request("GET", "/api/bookings/active", null, token));
  const activeAfterExit = response.status === 200 && json === null;
  logResult(
    "Bookings active after exit is null",
    activeAfterExit,
    `expected status 200 with null body, got status ${response.status}`
  );

  // Booking history
  ({ response, json } = await request("GET", "/api/bookings/history", null, token));
  expectStatus("Bookings history", response, 200);
  logResult("Bookings history is array", Array.isArray(json), "history response should be an array");

  // Delete vehicle with booking history should soft-delete and preserve history
  ({ response, json } = await request("DELETE", `/api/vehicles/${vehicleId}`, null, token));
  expectStatus("Vehicles delete with booking history", response, 200);

  // Print summary
  for (const r of results) {
    const mark = r.pass ? "PASS" : "FAIL";
    console.log(`[${mark}] ${r.name} - ${r.details}`);
  }

  if (failed > 0) {
    console.error(`\nVerification completed with ${failed} failure(s).`);
    process.exit(1);
  }

  console.log("\nVerification completed successfully with all checks passing.");
};

run().catch((err) => {
  console.error("Verification script crashed:", err);
  process.exit(1);
});
