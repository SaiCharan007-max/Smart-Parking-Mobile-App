-- This script creates the complete database schema for the ParkX application.
-- It includes tables for users, vehicles, slots, and bookings, along with necessary indexes.

-- Drop existing tables in reverse order of dependency to avoid foreign key errors.
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS slots;
DROP TABLE IF EXISTS users;

-- Table for storing user information
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing parking slot information
CREATE TABLE slots (
    id SERIAL PRIMARY KEY,
    area CHAR(1) NOT NULL,
    slot_number INT NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    UNIQUE(area, slot_number)
);

-- Table for storing user's vehicle information
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(20) UNIQUE NOT NULL,
    model VARCHAR(255) NOT NULL, -- Added model column
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing booking and parking session information
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id INT NOT NULL REFERENCES vehicles(id),
    slot_id INT NOT NULL REFERENCES slots(id),
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    exit_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INT,
    total_amount NUMERIC(10, 2),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'completed')),
    payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('pending', 'paid')),
    pricing_rate_per_hour NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add some initial data for parking slots
INSERT INTO slots (area, slot_number) VALUES
('a', 1), ('a', 2), ('a', 3), ('a', 4), ('a', 5), ('a', 6), ('a', 7), ('a', 8), ('a', 9), ('a', 10),
('a', 11), ('a', 12), ('a', 13), ('a', 14), ('a', 15), ('a', 16), ('a', 17), ('a', 18), ('a', 19), ('a', 20),
('a', 21), ('a', 22), ('a', 23), ('a', 24), ('a', 25), ('a', 26), ('a', 27), ('a', 28), ('a', 29), ('a', 30),
('a', 31), ('a', 32), ('a', 33), ('a', 34), ('a', 35),
('b', 1), ('b', 2), ('b', 3), ('b', 4), ('b', 5), ('b', 6), ('b', 7), ('b', 8), ('b', 9), ('b', 10),
('b', 11), ('b', 12), ('b', 13), ('b', 14), ('b', 15), ('b', 16), ('b', 17), ('b', 18), ('b', 19), ('b', 20),
('b', 21), ('b', 22), ('b', 23), ('b', 24), ('b', 25), ('b', 26), ('b', 27), ('b', 28), ('b', 29), ('b', 30),
('b', 31), ('b', 32), ('b', 33), ('b', 34), ('b', 35), ('b', 36), ('b', 37), ('b', 38), ('b', 39), ('b', 40),
('b', 41), ('b', 42), ('b', 43), ('b', 44), ('b', 45), ('b', 46),
('c', 1), ('c', 2), ('c', 3), ('c', 4), ('c', 5), ('c', 6), ('c', 7), ('c', 8), ('c', 9), ('c', 10),
('c', 11), ('c', 12), ('c', 13), ('c', 14), ('c', 15), ('c', 16), ('c', 17), ('c', 18), ('c', 19), ('c', 20),
('c', 21), ('c', 22), ('c', 23), ('c', 24), ('c', 25), ('c', 26), ('c', 27), ('c', 28), ('c', 29), ('c', 30);

-- Create indexes for better query performance
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_vehicle_id ON bookings(vehicle_id);
CREATE INDEX idx_bookings_slot_id ON bookings(slot_id);
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);

-- --- END OF SCRIPT ---
