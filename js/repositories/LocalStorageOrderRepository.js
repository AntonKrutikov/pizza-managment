import { Order } from '../models/Order.js'
import { OrderRepository } from './OrderRepository.js'

const STORAGE_KEY = 'pizzaShopOrders'

/**
 * LocalStorage implementation of OrderRepository
 * Maintains exact same storage format for backward compatibility
 */
export class LocalStorageOrderRepository extends OrderRepository {
	constructor() {
		super()
		this._orders = []
		this._orderMap = new Map() // O(1) lookup index for orders by ID
		this._cachedOngoing = null // Cached filter results
		this._cachedCompleted = null // Cached filter results
		this._orderCounter = 0
		this._loadFromStorage()
	}

	_loadFromStorage() {
		const saved = localStorage.getItem(STORAGE_KEY)
		if (saved) {
			const data = JSON.parse(saved)
			this._orders = (data.orders || []).map(o => Order.fromJSON(o))
			this._orderCounter = data.orderCounter || 0
			// Populate index map for O(1) lookups
			this._orderMap.clear()
			this._orders.forEach(order => this._orderMap.set(order.id, order))
		} else {
			this._orders = []
			this._orderCounter = 0
			this._orderMap.clear()
		}
	}

	_saveToStorage() {
		const data = {
			orders: this._orders.map(o => o.toJSON()),
			orderCounter: this._orderCounter
		}
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
	}

	// === CRUD Operations ===

	save(order) {
		const index = this._orders.findIndex(o => o.id === order.id)
		const orderInstance = order instanceof Order ? order : Order.fromJSON(order)

		if (index !== -1) {
			this._orders[index] = orderInstance
		} else {
			this._orders.push(orderInstance)
		}
		// Update index map for O(1) lookups
		this._orderMap.set(orderInstance.id, orderInstance)
		// Invalidate filter caches
		this._cachedOngoing = null
		this._cachedCompleted = null
		this._saveToStorage()
		return orderInstance
	}

	delete(orderId) {
		const index = this._orders.findIndex(o => o.id === orderId)
		if (index !== -1) {
			this._orders.splice(index, 1)
			// Remove from index map
			this._orderMap.delete(orderId)
			// Invalidate filter caches
			this._cachedOngoing = null
			this._cachedCompleted = null
			this._saveToStorage()
			return true
		}
		return false
	}

	findById(orderId) {
		// O(1) lookup using Map instead of O(n) array scan
		return this._orderMap.get(orderId) || null
	}

	// === Query Operations ===

	findAll() {
		return [...this._orders]
	}

	findOngoing() {
		// Return cached result if available
		if (this._cachedOngoing !== null) {
			return this._cachedOngoing
		}
		// Filter and cache the result
		this._cachedOngoing = this._orders.filter(o => o.isOngoing())
		return this._cachedOngoing
	}

	findCompleted() {
		// Return cached result if available
		if (this._cachedCompleted !== null) {
			return this._cachedCompleted
		}
		// Filter and cache the result
		this._cachedCompleted = this._orders.filter(o => o.isCompleted()).reverse()
		return this._cachedCompleted
	}

	findByDateRange(startTimestamp, endTimestamp) {
		return this._orders.filter(o =>
			o.timestamp >= startTimestamp && o.timestamp <= endTimestamp
		)
	}

	// === Counter Management ===

	getOrderCounter() {
		return this._orderCounter
	}

	incrementOrderCounter() {
		this._orderCounter++
		this._saveToStorage()
		return this._orderCounter
	}

	// === Batch Operations ===

	importOrders(orders, orderCounter) {
		this._orders = orders.map(o => Order.fromJSON(o))
		this._orderCounter = orderCounter
		// Rebuild index map
		this._orderMap.clear()
		this._orders.forEach(order => this._orderMap.set(order.id, order))
		this._saveToStorage()
	}

	clearAll() {
		this._orders = []
		this._orderMap.clear()
		this._orderCounter = 0
		localStorage.removeItem(STORAGE_KEY)
	}

	// === Backward Compatibility ===
	// Getters for existing code that needs direct access

	get orders() {
		return this._orders
	}

	get orderCounter() {
		return this._orderCounter
	}
}
