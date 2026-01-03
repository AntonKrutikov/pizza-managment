import { Order } from '../models/Order.js'

/**
 * OrderService - Business logic layer for order management
 * Decoupled from storage - uses injected repository
 */
export class OrderService {
	constructor(repository) {
		this.repository = repository
	}

	// === Backward Compatibility Properties ===
	// These allow existing code to work during transition

	get orders() {
		return this.repository.orders
	}

	get orderCounter() {
		return this.repository.orderCounter
	}

	// === Order Creation ===

	addOrder(orderData) {
		const orderNo = this.repository.incrementOrderCounter()
		const order = Order.create(orderData, orderNo)
		this.repository.save(order)
		return order
	}

	// === Status Updates ===

	markAsServed(orderId) {
		const order = this.repository.orders.find(o => o.id === orderId)
		if (order) {
			order.served = true
			order.servedAt = Date.now()
			this.repository._saveToStorage()
		}
	}

	markAsUnserved(orderId) {
		const order = this.repository.orders.find(o => o.id === orderId)
		if (order) {
			order.served = false
			order.servedAt = null
			this.repository._saveToStorage()
		}
	}

	markAsPaid(orderId, paymentType = null) {
		const order = this.repository.orders.find(o => o.id === orderId)
		if (order) {
			order.paid = true
			order.paidAt = Date.now()
			if (paymentType) {
				order.paymentType = paymentType
			}
			this.repository._saveToStorage()
		}
	}

	markAsUnpaid(orderId) {
		const order = this.repository.orders.find(o => o.id === orderId)
		if (order) {
			order.paid = false
			order.paidAt = null
			order.paymentType = null
			this.repository._saveToStorage()
		}
	}

	restoreToOngoing(orderId) {
		const order = this.repository.orders.find(o => o.id === orderId)
		if (order) {
			order.served = false
			order.servedAt = null
			order.paid = false
			order.paidAt = null
			order.paymentType = null
			this.repository._saveToStorage()
		}
	}

	removeOrder(orderId) {
		this.repository.delete(orderId)
	}

	// === Order Updates ===

	updateEatType(orderId, eatType) {
		const order = this.repository.orders.find(o => o.id === orderId)
		if (order) {
			order.eatType = eatType
			this.repository._saveToStorage()
		}
	}

	updateTableNumber(orderId, tableNumber) {
		const order = this.repository.orders.find(o => o.id === orderId)
		if (order) {
			order.tableNumber = tableNumber
			this.repository._saveToStorage()
		}
	}

	updateSoundIndicator(orderId, soundIndicator) {
		const order = this.repository.orders.find(o => o.id === orderId)
		if (order) {
			order.soundIndicator = soundIndicator
			this.repository._saveToStorage()
		}
	}

	removeItemFromOrder(orderId, itemIndex) {
		const order = this.repository.orders.find(o => o.id === orderId)
		if (order && order.items && order.items[itemIndex]) {
			const removedItem = order.items.splice(itemIndex, 1)[0]
			order.price = order.items.reduce((sum, item) => sum + parseInt(item.price), 0)
			order.pizzaType = order.items.map(item => item.name).join(", ")
			this.repository._saveToStorage()
			return removedItem
		}
		return null
	}

	markItemAsServed(orderId, itemIndex) {
		const order = this.repository.orders.find(o => o.id === orderId)
		if (order && order.items && order.items[itemIndex]) {
			order.items[itemIndex].served = true
			this.repository._saveToStorage()
			return true
		}
		return false
	}

	markItemAsUnserved(orderId, itemIndex) {
		const order = this.repository.orders.find(o => o.id === orderId)
		if (order && order.items && order.items[itemIndex]) {
			order.items[itemIndex].served = false
			this.repository._saveToStorage()
			return true
		}
		return false
	}

	// === Query Methods ===

	getOrders() {
		// Return orders that are not completed (completed = served AND paid)
		// This includes: unserved orders AND served-but-unpaid orders
		return this.repository.orders.filter(o => !o.served || (o.served && !o.paid)).slice()
	}

	getServedOrders() {
		// Return only completed orders (served AND paid), sorted by most recent first
		return this.repository.orders.filter(o => o.served && o.paid).slice().reverse()
	}

	// === Utility Methods ===

	getElapsedTime(timestamp) {
		const elapsed = Date.now() - timestamp
		const minutes = Math.floor(elapsed / 60000)
		const seconds = Math.floor((elapsed % 60000) / 1000)
		return `${minutes}:${seconds.toString().padStart(2, "0")}`
	}

	// === Storage Management (delegated to repository) ===

	loadFromStorage() {
		this.repository._loadFromStorage()
	}
}
