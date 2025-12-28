# Copilot Instructions for AI Coding Agents

This project is a pizza shop management system built in vanilla JavaScript (no frameworks). The application will allow staff to create and manage customer pizza orders.

## Architecture & Workflow

- The system is a browser-based app, with all logic in vanilla JS, HTML, and CSS.
- For the initial prototype, use mock services and in-memory data structures for orders and notifications. Do not implement a backend API yet.
- Orders are created by staff via a form: select pizza type, mark as paid/unpaid, choose eat-in or take-away.
- All ongoing orders are displayed in a live-updating list, sorted by time received.
- Orders entered by one staff member immediately appear on the order list for other staff.
- If a second staff member is not viewing the app, they should receive a push notification (PWA required).
- After the prototype is validated, plan to add a backend API and migrate from mock data to persistent storage.

## Key Conventions

- Organize files by feature: e.g., order creation, order list, notification logic.
- Use clear, descriptive names for JS modules and UI components.
- Document any custom data structures for orders and notifications in README.md.
- Prefer simple, readable code and avoid external dependencies unless strictly necessary.

## Developer Guidance

- Scaffold the app with index.html, main.js, and style.css as entry points.
- Document build/run/test steps in README.md as they are introduced.
- If implementing PWA features, document service worker and notification logic clearly.
- Update this file and README.md as new features, patterns, or workflows are added.

## Example Structure (to update as project evolves)

- index.html: Main UI entry point
- js/orderForm.js: Order creation logic
- js/orderList.js: Ongoing orders display
- js/notifications.js: Push notification logic
- sw.js: Service worker for PWA

---

**Update this file as the project grows to ensure AI agents remain productive and aligned with project-specific practices.**
