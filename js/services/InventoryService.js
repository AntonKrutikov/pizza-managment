import EventBus from '../core/EventBus.js';
import { InventoryEvents } from '../core/EventTypes.js';

/**
 * InventoryService
 * Business logic for inventory management
 */
export class InventoryService {
  constructor(repository) {
    this.repository = repository;
    this.inventory = this.repository.load();
  }

  /**
   * Get current inventory state
   */
  getInventory() {
    return this.inventory;
  }

  /**
   * Set dough count (initial or manual set)
   * @param {number} count
   */
  setDoughCount(count) {
    const parsedCount = parseInt(count, 10);
    if (isNaN(parsedCount) || parsedCount < 0) {
      throw new Error('Invalid count: must be a non-negative integer');
    }

    this.inventory.dough.count = parsedCount;
    this.inventory.dough.lastSet = Date.now();
    this.repository.save(this.inventory);

    EventBus.emit(InventoryEvents.DOUGH_COUNT_SET, {
      count: parsedCount,
      timestamp: this.inventory.dough.lastSet
    });

    this._checkStockLevels();
  }

  /**
   * Adjust dough count by amount (can be positive or negative)
   * @param {number} amount
   */
  adjustDoughCount(amount) {
    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount)) {
      throw new Error('Invalid amount: must be an integer');
    }

    const oldCount = this.inventory.dough.count;
    const newCount = Math.max(0, oldCount + parsedAmount);
    this.inventory.dough.count = newCount;
    this.repository.save(this.inventory);

    EventBus.emit(InventoryEvents.DOUGH_ADJUSTED, {
      oldCount,
      newCount,
      amount: parsedAmount,
      timestamp: Date.now()
    });

    this._checkStockLevels();
  }

  /**
   * Deduct dough for pizzas (called when orders placed)
   * @param {number} pizzaCount
   */
  deductDoughForPizzas(pizzaCount) {
    if (!this.inventory.isDoughTrackingEnabled()) {
      return; // Don't deduct if tracking disabled
    }

    const parsedCount = parseInt(pizzaCount, 10);
    if (isNaN(parsedCount) || parsedCount <= 0) {
      return; // Nothing to deduct
    }

    const oldCount = this.inventory.dough.count;
    const newCount = Math.max(0, oldCount - parsedCount);
    this.inventory.dough.count = newCount;
    this.repository.save(this.inventory);

    EventBus.emit(InventoryEvents.DOUGH_DEDUCTED, {
      oldCount,
      newCount,
      deducted: parsedCount,
      timestamp: Date.now()
    });

    this._checkStockLevels();
  }

  /**
   * Enable dough tracking
   */
  enableTracking() {
    this.inventory.dough.trackingEnabled = true;
    this.repository.save(this.inventory);

    EventBus.emit(InventoryEvents.TRACKING_ENABLED, {
      timestamp: Date.now()
    });

    this._checkStockLevels();
  }

  /**
   * Disable dough tracking
   */
  disableTracking() {
    this.inventory.dough.trackingEnabled = false;
    this.repository.save(this.inventory);

    EventBus.emit(InventoryEvents.TRACKING_DISABLED, {
      timestamp: Date.now()
    });

    this._checkStockLevels();
  }

  /**
   * Count pizzas in order items array
   * @param {Array} items
   * @returns {number}
   */
  countPizzasInItems(items) {
    if (!Array.isArray(items)) {
      return 0;
    }

    return items.reduce((count, item) => {
      return count + (this._isPizza(item) ? 1 : 0);
    }, 0);
  }

  /**
   * Check if item is a pizza
   * @param {Object} item
   * @returns {boolean}
   * @private
   */
  _isPizza(item) {
    // Primary: check category
    if (item.category && item.category.toLowerCase() === 'pizza') {
      return true;
    }

    // Fallback: check image path
    if (item.image && item.image.includes('pizza')) {
      return true;
    }

    return false;
  }

  /**
   * Check stock levels and emit warning events
   * @private
   */
  _checkStockLevels() {
    const status = this.inventory.getStockStatus();

    switch (status) {
      case 'out':
        EventBus.emit(InventoryEvents.STOCK_OUT, {
          count: this.inventory.dough.count,
          timestamp: Date.now()
        });
        break;
      case 'critical':
        EventBus.emit(InventoryEvents.STOCK_CRITICAL, {
          count: this.inventory.dough.count,
          timestamp: Date.now()
        });
        break;
      case 'low':
        EventBus.emit(InventoryEvents.STOCK_LOW, {
          count: this.inventory.dough.count,
          timestamp: Date.now()
        });
        break;
      case 'normal':
        EventBus.emit(InventoryEvents.STOCK_NORMAL, {
          count: this.inventory.dough.count,
          timestamp: Date.now()
        });
        break;
      // 'disabled' status doesn't emit events
    }
  }
}
