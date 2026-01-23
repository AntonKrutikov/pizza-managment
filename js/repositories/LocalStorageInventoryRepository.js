import { InventoryRepository } from './InventoryRepository.js';
import { Inventory } from '../models/Inventory.js';

/**
 * LocalStorage implementation of InventoryRepository
 */
export class LocalStorageInventoryRepository extends InventoryRepository {
  constructor() {
    super();
    this.storageKey = 'pizzaShopInventory';
  }

  /**
   * Load inventory from localStorage
   * @returns {Inventory}
   */
  load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        return Inventory.create();
      }
      return Inventory.fromJSON(data);
    } catch (error) {
      console.error('Error loading inventory from localStorage:', error);
      return Inventory.create();
    }
  }

  /**
   * Save inventory to localStorage
   * @param {Inventory} inventory
   */
  save(inventory) {
    try {
      const json = JSON.stringify(inventory.toJSON());
      localStorage.setItem(this.storageKey, json);
    } catch (error) {
      console.error('Error saving inventory to localStorage:', error);
      throw error;
    }
  }

  /**
   * Clear all inventory data from localStorage
   */
  clear() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Error clearing inventory from localStorage:', error);
      throw error;
    }
  }
}
