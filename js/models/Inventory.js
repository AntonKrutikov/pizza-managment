/**
 * Inventory Model
 * Manages stock tracking for ingredients (currently dough)
 */
export class Inventory {
  constructor(data = {}) {
    this.dough = {
      count: data.dough?.count ?? 0,
      trackingEnabled: data.dough?.trackingEnabled ?? false,
      lastSet: data.dough?.lastSet ?? null
    };
  }

  /**
   * Factory method to create new inventory
   */
  static create() {
    return new Inventory({
      dough: {
        count: 0,
        trackingEnabled: false,
        lastSet: null
      }
    });
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(json) {
    if (typeof json === 'string') {
      json = JSON.parse(json);
    }
    return new Inventory(json);
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      dough: {
        count: this.dough.count,
        trackingEnabled: this.dough.trackingEnabled,
        lastSet: this.dough.lastSet
      }
    };
  }

  /**
   * Getters
   */
  isDoughTrackingEnabled() {
    return this.dough.trackingEnabled;
  }

  getDoughCount() {
    return this.dough.count;
  }

  /**
   * Stock status helpers
   */
  isLowStock() {
    return this.dough.trackingEnabled && this.dough.count > 0 && this.dough.count <= 10;
  }

  isCriticalStock() {
    return this.dough.trackingEnabled && this.dough.count > 0 && this.dough.count <= 5;
  }

  isOutOfStock() {
    return this.dough.trackingEnabled && this.dough.count === 0;
  }

  getStockStatus() {
    if (!this.dough.trackingEnabled) return 'disabled';
    if (this.isOutOfStock()) return 'out';
    if (this.isCriticalStock()) return 'critical';
    if (this.isLowStock()) return 'low';
    return 'normal';
  }

  getStockStatusMessage() {
    const status = this.getStockStatus();
    switch (status) {
      case 'disabled': return 'Tracking disabled';
      case 'out': return 'Out of stock!';
      case 'critical': return 'Critical - restock soon';
      case 'low': return 'Running low';
      case 'normal': return 'Stock is good';
      default: return '';
    }
  }
}
