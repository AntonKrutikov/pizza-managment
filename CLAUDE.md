## Project Overview

Browser-based Point of Sale (POS) system for a pizza shop. Built with vanilla JavaScript (ES6 modules), HTML5, and CSS3 - no frameworks or build tools. Offline first design using LocalStorage (for now) for data persistence.

## Project Structure

```
pizza-shop/
  ├── index.html              → Main UI shell (screens, navigation, popups)
  ├── main.js                 → App orchestrator (menu loading, routing, events, order form)
  ├── style.css               → All CSS styles (mobile-first, responsive, CSS variables)
  ├── CLAUDE.md               → Project instructions for AI assistants
  │
  ├── js/
  │   ├── firebase.js         → Firebase config, anonymous auth, Firestore backup
  │   ├── analytics.js        → Metrics calculation, chart generation (pie/bar)
  │   ├── orderList.js        → Order rendering, popup/modal management
  │   │
  │   ├── models/
  │   │   └── Order.js        → Order data model (create, serialize, status helpers)
  │   │
  │   ├── repositories/
  │   │   ├── OrderRepository.js           → Abstract storage interface
  │   │   └── LocalStorageOrderRepository.js → LocalStorage implementation
  │   │
  │   └── services/
  │       └── OrderService.js  → Business logic (CRUD, status updates, queries)
  │
  ├── data/
  │   └── menu.json           → Menu catalog (categories, items, prices, variants)
  │
  └── images/
      ├── icons/              → Ingredient/type icons (cheese, ham, etc.)
      ├── pizza/              → Pizza product images
      ├── quesadilla/         → Quesadilla product images
```

**Data Flow:** User Action → main.js → OrderService → Repository → LocalStorage → Re-render UI

## Key Conventions

- Organize files by feature (order creation, order list, analytics and etc.)
- Use clear, descriptive names for JS modules and functions
- Prefer simple, readable code without external dependencies
- Repository pattern for swappable storage backends
- Service layer decouples business logic from persistence
- Model objects with factory methods and serialization

## UI Conventions

- Mobile-first responsive design
- Mainly used on big pos screen or tablet
- Touch-friendly buttons and inputs, minimize entering text, focus more on selection
- Clear visual hierarchy with cards, modals, and tabs
- Use existing color scheme (orange primary: #D35400)
- Use CSS variables for colors, fonts, spacing, try to keep consistent styles
- Use icons (SVG or emoji) for better visual cues

## Future Plans

- PWA features (offline first, service worker, push notifications)
- Firestore storage for multi-device sync and account system
- Code refactoring into a component-based architecture and clean project structure, using native Web Components