# Home Assignment: Security Automation Playbook Builder

_Text extracted from `Playblocks - Full Stack Developer - Home Assignment 2026.docx` for quick reference. The original .docx (with UI mockup screenshots) is kept alongside this file._

## Introduction

Build a minimal web app that lets users create and simulate simple security automation playbooks. Each playbook has a name, a trigger, and a list of predefined actions.

The task is expected to take 0.5-1 days.

**Outcome:** Code exercise as zip or rar with README file to explain how to run it locally.

## Core Features

### 1. User Authentication

- Basic email-based login/registration
- Store users in the database
- Use basic token system to protect routes

### 2. Playbooks Management

Each playbook includes:

- A name
- A trigger (e.g., Malware Detected, Login Attempt, Phishing Alert)
- A list of actions (choose from: Isolate Host, Notify Admin, Block IP)

Users can:

- Create a new playbook (max 1 trigger + 1-3 actions)
- View their existing playbooks
- Delete a playbook (editing is optional)

### 3. Simulation

On the dashboard:

- Select a trigger to simulate an event
- Show which playbooks match the trigger
- Display the list of actions that would run

### 4. Interface

- Minimal React app
- 3 pages:
  - Login/Register
  - Create playbook
  - Simulate Event (with a list of results)

## Technical Requirements

### Backend

- Node.js / TypeScript
- Database of choice: Postgres / MongoDB / MySQL etc.
- Use asynchronous methodologies
- REST API endpoints:
  - `/auth/register`, `/auth/login`
  - `/playbooks` (GET, POST, DELETE)
  - `/simulateTrigger` (POST)

### Frontend

- React
- Communication between the client and server should be based on REST or GraphQL calls
- The UI should be easy to work with (not required to spend too much time on CSS)
- Forms for login and creating playbooks
- Display playbooks and simulate triggers

## Evaluation Criteria

- Code readability and structure
- Functional REST integration between frontend and backend
- Clean separation of concerns and reusable components
- Error handling
- Tests
- Documentation
