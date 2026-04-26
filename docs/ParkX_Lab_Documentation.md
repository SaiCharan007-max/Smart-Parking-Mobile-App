# 1. Cover Page

**Project Title:** ParkX - Smart Parking Application  
**Student Name(s):** [Your Name]  
**Roll Number(s):** [Your Roll Number]  
**Course Name & Code:** Mobile Application Lab [Course Code]  
**Institution Name:** [Your Institution Name]  
**Submission Date:** [Date]  

---   

# 2. Certificate

This is to certify that the project entitled **"ParkX - Smart Parking Application"** is the bona fide work carried out by **[Your Name]** bearing Roll No. **[Your Roll Number]** in partial fulfillment of the requirements for the **Mobile Application Lab**, under my supervision and guidance.

**Signature of Instructor:** ____________________  
**Date:** ____________________  

---

# 3. Abstract

Urban areas face significant challenges regarding parking management, leading to traffic congestion, wasted fuel, and driver frustration. **ParkX** is a comprehensive Smart Parking Application designed to address these issues by providing a seamless interface for users to find, book, and manage parking slots dynamically. 

The system leverages a modern technology stack, featuring a cross-platform mobile application built with React Native and Expo, communicating with a robust Node.js and Express.js backend. Data persistence is handled via a PostgreSQL database. Key features include user authentication, vehicle management, real-time parking slot availability checking, booking history tracking, and digital receipt generation. By streamlining the parking process, ParkX aims to optimize parking space utilization and enhance the overall user experience for everyday commuters.

---

# 4. Table of Contents

1. Cover Page
2. Certificate
3. Abstract
4. Table of Contents
5. Introduction
6. Problem Statement
7. Scope of the Project
8. System Requirements
9. System Design
10. Module Description
11. Implementation Details
12. User Interface Screens
13. Testing
14. Results and Discussion
15. Conclusion

---

# 5. Introduction

## Background of the problem
With the rapid increase in vehicle ownership, finding an empty parking space in busy urban areas, shopping malls, and business districts has become extremely difficult. Drivers spend a considerable amount of time circling around, which not only causes stress but also contributes to fuel wastage and environmental pollution.

## Need for the application
There is an urgent need for an automated, real-time parking management system that allows drivers to secure a parking spot before or upon arriving at their destination. A mobile-first approach ensures that accessibility and convenience are maximized.

## Objectives of the project
- To develop a cross-platform mobile application for smart parking.
- To provide real-time updates on parking slot availability.
- To allow users to securely register, add vehicles, and map bookings to their accounts.
- To manage user sessions and booking histories efficiently with a reliable backend.

---

# 6. Problem Statement

To design and develop a mobile-based Smart Parking System (ParkX) that bridges the gap between parking facility operators and drivers. The system needs to provide an intuitive interface for users to authenticate, select an available parking zone (Area A, B, C, etc.), book a designated slot, and generate a receipt, while dynamically updating the slot inventory in a central database to prevent double-booking.

---

# 7. Scope of the Project

**Features included:**
- Secure User Authentication (Login/Register) utilizing JWT.
- Vehicle Management (Add, view, and assign vehicles).
- Real-time Parking Slot Inventory (Areas and specific slot numbers).
- Active Booking creation and tracking.
- Historical view of past bookings and receipt generation.

**Limitations:**
- No physical IoT sensor integration represented in this software iteration (assumes software-level mapping).
- Simulated payment gateway (focus is on process flow).

**Target users:**
- Daily commuters, shoppers, and general drivers seeking guaranteed parking.
- Parking facility administrators.

---

# 8. System Requirements

## 8.1 Hardware Requirements
- **Mobile Device/Emulator:** Android 11.0+ / iOS 14.0+ with at least 4GB RAM.
- **Development Machine:** Minimum 8GB RAM, Core i5 Processor, 50GB Free Storage.

## 8.2 Software Requirements
- **IDE:** Visual Studio Code / Android Studio (for emulator).
- **Programming Language:** JavaScript / React Native (Client), Node.js (Server).
- **Frameworks:** Expo (React Native), Express.js.
- **Database:** PostgreSQL.
- **OS Requirements:** Windows 10/11, macOS, or Linux.

---

# 9. System Design

## 9.1 Architecture Diagram
The system utilizes a 3-tier Client-Server Architecture:
1. **Presentation Layer (Client):** React Native mobile app (Expo Router).
2. **Business Logic Layer (Server):** Node.js REST API with Express.js.
3. **Data Access Layer (Database):** PostgreSQL containing relational data.

## 9.2 Data Flow
1. User opens app -> Presentation Layer.
2. User authenticates -> API POST `/api/auth/login`.
3. User selects a slot -> API GET `/api/slots`.
4. User confirms booking -> API POST `/api/bookings`.

## 9.3 Database Design (PostgreSQL Schema)
- **Users Table:** `id`, `username`, `email`, `password_hash`, `created_at`.
- **Vehicles Table:** `id`, `user_id`, `license_plate`, `make`, `model`, `deleted_at`.
- **Slots Table:** `id`, `area`, `slot_number`, `is_occupied`.
- **Bookings Table:** `id`, `user_id`, `vehicle_id`, `slot_id`, `start_time`, `end_time`, `amount_paid`.

---

# 10. Module Description

1. **Authentication Module:** Handles secure login and registration. Utilizes JWT (JSON Web Tokens) stored securely via `AsyncStorage`.
2. **Vehicle Management Module:** Enables users to register their vehicles linked to their user account, required before booking a slot.
3. **Slot Management Module:** Fetches real-time availability of parking spaces categorized by designated areas (e.g., Area A, Area B).
4. **Booking & Navigation Module:** 
   - Allows the user to initiate a parking session. 
   - Provides navigation between Dashboard, Active Parking, History, and User Profile using Expo Router `(app)/` and `(auth)/` flows.
5. **Receipt/Billing Module:** Generates an end-of-session summary incorporating billing metrics, mapped to the `[bookingId]` route.

---

# 11. Implementation Details

- **Frontend Tech:** Built using React Native mapped out with Expo Router for file-based routing. UI components are modularized (e.g., `ActiveParking.js`, `ModifiedButton.js`). Contexts and Hooks (`useSession`, `useThemeMode`) manage global state.
- **Backend Tech:** Node.js server bootstrapped by Express. Request handling is routed via specialized controllers (`auth.controller.js`, `booking.controller.js`). 
- **Database Connection:** Utilizes `pg` (PostgreSQL client for Node.js) with connection pooling (`pool.query`).
- **APIs Used:** Custom internal REST API interconnected using the `axios` library on the frontend (`api.js`).

---

# 12. User Interface Screens

*(Insert Screenshots Here in the Final PDF)*

1. **Login Page:** Allows users to input email and password. Focuses on dark-themed UI with clean typography. *(See attached screenshot of ParkX Sign In).*
2. **Dashboard/Home:** Displays Active Parking sessions, available slots summary, and quick links to 'My Vehicles'.
3. **Feature Screens:** The 'Areas' and 'Slots' screens where users select their preferred parking spot.
4. **Receipt Screen:** A summarized view of the parking duration, vehicle parked, and total cost once the session completes.

---

# 13. Testing

| Test Case | Input | Expected Output | Result |
| :--- | :--- | :--- | :--- |
| **TC01: Valid Login** | Valid Email & Password | Redirect to Home/Dashboard (`/(app)/index`) | Pass |
| **TC02: Invalid Login** | Wrong Password | Show "Invalid Credentials" Toast/Error | Pass |
| **TC03: Add Vehicle** | License Plate string | Vehicle added to list mapping to User ID | Pass |
| **TC04: Prevent Double Booking** | Select currently occupied slot | API rejects booking; UI shows slot disabled | Pass |
| **TC05: API Disconnect** | Backend offline | Axios interceptor returns "Network Error" gracefully | Pass |

---

# 14. Results and Discussion

- **Output obtained:** The application successfully runs on mobile devices, seamlessly connecting to the locally hosted backend server using the machine's IP address. User flows from authentication to booking a slot operate smoothly.
- **Performance observations:** State changes and routing using Expo Router are highly responsive. The PostgreSQL database efficiently handles concurrent slot polling queries.
- **Challenges faced:** Dynamic IP configuration for the Expo Client to reach the local backend server (resolved by updating the `.env` `EXPO_PUBLIC_API_URL` variable properly).

---

# 15. Conclusion

**Summary of achievements:**
The ParkX Smart Parking App successfully implements a full-stack mobile application solution. It achieves its primary objective of digitizing the parking allocation process securely via a mobile interface. 

**Learning outcomes:**
Through the development of this project, extensive practical knowledge was gained in cross-platform mobile development (React Native/Expo), asynchronous REST API integration (Axios), and relational database modeling (PostgreSQL).

---
*Note: Format to 1.5 line spacing and Times New Roman 12pt if exporting via Word/Google Docs.*