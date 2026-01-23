import EventBus from './core/EventBus.js';
import { InventoryEvents } from './core/EventTypes.js';

/**
 * Inventory UI Controller
 * Manages the stock management screen UI and interactions
 */

let inventoryService = null;

/**
 * Initialize inventory UI
 * @param {InventoryService} service
 */
export function initInventoryUI(service) {
  inventoryService = service;

  // Get UI elements
  const inventoryBtn = document.getElementById('inventory-btn');
  const inventorySection = document.getElementById('inventory-section');
  const inventoryBackBtn = document.getElementById('inventory-back-btn');
  const trackingToggle = document.getElementById('dough-tracking-toggle');
  const setCountBtn = document.getElementById('set-dough-count-btn');
  const countInput = document.getElementById('dough-count-input');
  const adjustmentBtns = document.querySelectorAll('.adjustment-btn');

  // Navigation handlers
  inventoryBtn.addEventListener('click', showInventoryScreen);
  inventoryBackBtn.addEventListener('click', hideInventoryScreen);

  // Tracking toggle handler
  trackingToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      inventoryService.enableTracking();
    } else {
      inventoryService.disableTracking();
    }
    updateInventoryDisplay();
  });

  // Set count handler
  setCountBtn.addEventListener('click', () => {
    const count = parseInt(countInput.value, 10);
    if (isNaN(count) || count < 0) {
      alert('Please enter a valid non-negative number');
      return;
    }
    try {
      inventoryService.setDoughCount(count);
      updateInventoryDisplay();
    } catch (error) {
      alert('Error setting count: ' + error.message);
    }
  });

  // Quick adjustment handlers
  adjustmentBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const amount = parseInt(btn.dataset.amount, 10);
      try {
        inventoryService.adjustDoughCount(amount);
        updateInventoryDisplay();
      } catch (error) {
        alert('Error adjusting count: ' + error.message);
      }
    });
  });

  // Subscribe to inventory events for UI updates
  EventBus.subscribe(InventoryEvents.DOUGH_COUNT_SET, () => {
    updateInventoryDisplay();
  });

  EventBus.subscribe(InventoryEvents.DOUGH_DEDUCTED, () => {
    updateInventoryDisplay();
  });

  EventBus.subscribe(InventoryEvents.DOUGH_ADJUSTED, () => {
    updateInventoryDisplay();
  });

  EventBus.subscribe(InventoryEvents.TRACKING_ENABLED, () => {
    updateInventoryDisplay();
  });

  EventBus.subscribe(InventoryEvents.TRACKING_DISABLED, () => {
    updateInventoryDisplay();
  });

  // Subscribe to stock warning events
  EventBus.subscribe(InventoryEvents.STOCK_OUT, () => {
    updateStockWarningBadge('out');
  });

  EventBus.subscribe(InventoryEvents.STOCK_CRITICAL, () => {
    updateStockWarningBadge('critical');
  });

  EventBus.subscribe(InventoryEvents.STOCK_LOW, () => {
    updateStockWarningBadge('low');
  });

  EventBus.subscribe(InventoryEvents.STOCK_NORMAL, () => {
    updateStockWarningBadge('normal');
  });

  // Initial display update
  updateInventoryDisplay();
}

/**
 * Show inventory screen
 */
export function showInventoryScreen() {
  const inventorySection = document.getElementById('inventory-section');
  const nav = document.querySelector('.screen-nav');
  const otherScreens = document.querySelectorAll('.screen:not(#inventory-section)');

  // Hide main nav and other screens
  if (nav) nav.style.display = 'none';
  otherScreens.forEach((screen) => screen.classList.remove('active'));

  // Show inventory screen
  inventorySection.classList.add('active');

  // Update display
  updateInventoryDisplay();
}

/**
 * Hide inventory screen
 */
export function hideInventoryScreen() {
  const inventorySection = document.getElementById('inventory-section');
  const nav = document.querySelector('.screen-nav');

  // Show main nav
  if (nav) nav.style.display = 'flex';

  // Hide inventory screen
  inventorySection.classList.remove('active');

  // Show the previously active screen (take-order by default)
  const takeOrderScreen = document.getElementById('order-form-section');
  if (takeOrderScreen) {
    takeOrderScreen.classList.add('active');
  }
}

/**
 * Update inventory display
 */
export function updateInventoryDisplay() {
  if (!inventoryService) return;

  const inventory = inventoryService.getInventory();
  const trackingToggle = document.getElementById('dough-tracking-toggle');
  const countDisplay = document.getElementById('dough-count-display');
  const statusDisplay = document.getElementById('dough-status-display');
  const lastSetDisplay = document.getElementById('dough-last-set');
  const stockDisplayCard = document.getElementById('dough-stock-display');

  // Update tracking toggle
  trackingToggle.checked = inventory.isDoughTrackingEnabled();

  // Update count and status
  countDisplay.textContent = inventory.getDoughCount();
  statusDisplay.textContent = inventory.getStockStatusMessage();

  // Update last set time
  if (inventory.dough.lastSet) {
    const date = new Date(inventory.dough.lastSet);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    lastSetDisplay.textContent = `Last Set: ${dateStr}, ${timeStr}`;
  } else {
    lastSetDisplay.textContent = 'Last Set: Never';
  }

  // Update stock display card styling based on status
  const status = inventory.getStockStatus();
  stockDisplayCard.className = 'stock-display-card';
  stockDisplayCard.classList.add(`stock-${status}`);

  // Update stock warning badge
  updateStockWarningBadge(status);
}

/**
 * Update dough count display in header
 * @param {string} status - 'normal', 'low', 'critical', 'out', or 'disabled'
 */
function updateStockWarningBadge(status) {
  const headerCount = document.getElementById('dough-count-header');
  if (!headerCount) return;

  const inventory = inventoryService.getInventory();

  if (!inventory.isDoughTrackingEnabled()) {
    headerCount.style.display = 'none';
    return;
  }

  const count = inventory.getDoughCount();
  headerCount.textContent = `(Dough: ${count})`;
  headerCount.style.display = 'inline';

  // Apply color based on status
  headerCount.className = 'dough-count-header';
  if (status === 'out') {
    headerCount.classList.add('count-out');
  } else if (status === 'critical') {
    headerCount.classList.add('count-critical');
  } else if (status === 'low') {
    headerCount.classList.add('count-low');
  } else {
    headerCount.classList.add('count-normal');
  }
}

