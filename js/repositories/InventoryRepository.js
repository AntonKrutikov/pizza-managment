/**
 * Abstract Inventory Repository Interface
 * Defines contract for inventory storage implementations
 */
export class InventoryRepository {
  /**
   * Load inventory from storage
   * @returns {Inventory|null}
   */
  load() {
    throw new Error('load() must be implemented');
  }

  /**
   * Save inventory to storage
   * @param {Inventory} inventory
   */
  save(inventory) {
    throw new Error('save() must be implemented');
  }

  /**
   * Clear all inventory data
   */
  clear() {
    throw new Error('clear() must be implemented');
  }
}
