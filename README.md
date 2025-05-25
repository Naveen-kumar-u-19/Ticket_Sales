# Concurrent Ticket-Sales API

A high-concurrency-safe API for selling event tickets, built with Node.js, TypeScript, Prisma, PostgreSQL, and Docker. Handles 1000+ concurrent purchase requests without overselling.

---

## Features

- Sell tickets safely with transactional locking
- Prevent overselling with `SELECT ... FOR UPDATE`
- Idempotent POST /purchase using `Idempotency-Key`
- Metrics via `GET /stats`
- Handles 1000+ concurrent requests with zero race conditions

---

## Tech Stack

- Node.js + TypeScript
- Express.js
- Prisma ORM
- PostgreSQL (via Docker)
- Docker Compose
- Jest + Supertest (for unit testing)

---

##  Setup Instructions

### Prerequisites

- Docker & Docker Compose installed

---

### 1. Clone & Build

    git clone https://github.com/Naveen-kumar-u-19/Ticket_Sales.git
    cd ticket-sales-api
    docker compose build --no-cache

### 2. Start the App

    docker compose up -d

### 3. Seed the Database

    docker compose exec app npm run seed

### 4. Test the API

    http://localhost:3000/event

##  API Endpoints

### Prerequisites

- Run the below APIs in POSTMAN.

---

### 1. GET /event

    //Returns event details:
    {
      "totalSeats": 5000,
      "seatsSold": 20,
      "seatsRemaining": 498
    }
    
### 2. POST /purchase

    //Purchases 1–10 tickets. Requires:
    
    //JSON body:
    { "quantity": 2 }
    
    //Header:
    Idempotency-Key: some-unique-id

Responses:

-   `200 OK` if successful
    
-   `409 Conflict` with `{ "error": "SOLD_OUT" }` if not enough seats.


### 3. GET /stats

    //Returns request stats including p95 latency.
    {
      "requestCount": 1200,
      "successCount": 1000,
      "failCount": 200,
      "p95LatencyMs": 42
    }