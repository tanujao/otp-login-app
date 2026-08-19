# LLM Prompts Used During Development

This file documents the major prompt structures that were given to the LLM agent during the development of this OTP-Based User Login and Checkout application.

## Initial Request & Planning
The initial prompt provided the complete set of instructions:
> "I need you to build a complete full-stack web application for a hiring assignment. Build the complete application locally first. Do NOT deploy the application yet. Focus on a clean, working, production-quality local application..."

This prompt defined the architecture (React + FastAPI + PostgreSQL), the required tables (`users`, `checkout_orders`), UI flows, endpoints, edge cases, and all constraints.

## Architecture and Backend Implementation
The agent generated the backend utilizing standard FastAPI + SQLAlchemy ORM patterns based on the requirement:
> "BACKEND: Python, FastAPI, Pydantic, SQLAlchemy, PostgreSQL driver. Use a clean REST API architecture."

This involved prompt processing to create:
1. `models/user.py` and `models/checkout.py` matching the requested schema.
2. `schemas/auth.py`, `schemas/user.py`, `schemas/checkout.py` for request validation.
3. `services/auth_service.py` to securely generate the 6-digit code and bcrypt hashes as requested by:
   > "Generate a random 6-digit numeric code. Hash the code before storing it."

## Frontend Implementation & Real-time Validation
The prompt detailed a very specific UX for email recognition:
> "As the user types their email, validate the email in real time... Only call the recognition API when the email is complete and properly formatted. Use a debounce mechanism."

The LLM agent interpreted this and produced the debounced `useEffect` inside `Checkout.tsx`, ensuring that the `GET /api/users/recognize` is called asynchronously and does not block the checkout form typing.

## Design Refinement
> "Use the attached UI mockup image as the PRIMARY VISUAL REFERENCE for the frontend design... The desired style is: Clean, Modern, Minimal, White/light background, Blue primary actions..."

The agent used vanilla CSS variables and classes to approximate the visual mockup, maintaining the specified color scheme (`#2563eb` for primary blue, `#22c55e` for green success checks) across all forms, buttons, inputs, and the OTP modal.

*(Note: Since this code was generated in an autonomous agent environment, this `prompts.md` reflects the instruction processing performed by the agent itself based on the comprehensive initial prompt.)*

## Completing the Assignment
The final prompt asked to "COMPLETE and FIX the application according to the assignment", ensuring that:
1. Registration includes a "Copy OTP" feature.
2. User Recognition uses `POST /api/auth/recognize` and returns `recognized`.
3. OTP verification uses `POST /api/auth/verify-otp`.
4. The frontend state accurately maps all endpoints while keeping the existing UI/UX and keeping the frontend component `OTPModal.tsx` strictly linked to `verify-otp`.
The LLM successfully verified the missing implementation logic and integrated it cleanly.
