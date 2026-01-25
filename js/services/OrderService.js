import { Order } from '../models/Order.js'
import EventBus from '../core/EventBus.js'
import { OrderEvents } from '../core/EventTypes.js'

/**
 * OrderService - Business logic layer for order management
 * Decoupled from storage - uses injected repository
 * Emits events via EventBus for cross-component communication
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
		EventBus.emit(OrderEvents.ORDER_CREATED, { order })
		return order
	}

	// === Status Updates ===

	markAsServed(orderId) {
		const order = this.repository.orders.find(o => o.id === orderId)
		if (order) {
			order.served = true
			order.servedAt = Date.now()
			this.repository._saveToStorage()
			EventBus.emit(OrderEvents.ORDER_SERVED, { order, orderId })
			if (order.paid) {
				EventBus.emit(OrderEvents.ORDER_COMPLETED, { order, orderId })
			}
		}
	}

	markAsUnserved(orderId) {
		const order = this.repository.orders.find(o => o.id === orderId)
		if (order) {
			order.served = false
			order.servedAt = null
			this.repository._saveToStorage()
			EventBus.emit(OrderEvents.ORDER_UNSERVED, { order, orderId })
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
			EventBus.emit(OrderEvents.ORDER_PAID, { order, orderId, paymentType })
			if (order.served) {
				EventBus.emit(OrderEvents.ORDER_COMPLETED, { order, orderId })
			}
		}
	}

	markAsUnpaid(orderId) {
		const order = this.repository.orders.find(o => o.id === orderId)
		if (order) {
			order.paid = false
			order.paidAt = null
			order.paymentType = null
			this.repository._saveToStorage()
			EventBus.emit(OrderEvents.ORDER_UNPAID, { order, orderId })
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
			EventBus.emit(OrderEvents.ORDER_RESTORED, { order, orderId })
		}
	}

	removeOrder(orderId) {
		this.repository.delete(orderId)
		EventBus.emit(OrderEvents.ORDER_DELETED, { orderId })
	}

	// === Order Updates ===

	updateEatType(orderId, eatType) {
		const order = this.repository.orders.find(o => o.id === orderId)
		if (order) {
			const oldValue = order.eatType
			order.eatType = eatType
			this.repository._saveToStorage()
			EventBus.emit(OrderEvents.ORDER_UPDATED, { order, orderId, field: 'eatType', oldValue, newValue: eatType })
		}
	}

	updateTableNumber(orderId, tableNumber) {
		const order = this.repository.orders.find(o => o.id === orderId)
		if (order) {
			const oldValue = order.tableNumber
			order.tableNumber = tableNumber
			this.repository._saveToStorage()
			EventBus.emit(OrderEvents.ORDER_UPDATED, { order, orderId, field: 'tableNumber', oldValue, newValue: tableNumber })
		}
	}

	updateSoundIndicator(orderId, soundIndicator) {
		const order = this.repository.orders.find(o => o.id === orderId)
		if (order) {
			const oldValue = order.soundIndicator
			order.soundIndicator = soundIndicator
			this.repository._saveToStorage()
			EventBus.emit(OrderEvents.ORDER_UPDATED, { order, orderId, field: 'soundIndicator', oldValue, newValue: soundIndicator })
		}
	}

	removeItemFromOrder(orderId, itemIndex) {
		const order = this.repository.orders.find(o => o.id === orderId)
		if (order && order.items && order.items[itemIndex]) {
			const removedItem = order.items.splice(itemIndex, 1)[0]
			order.price = order.items.reduce((sum, item) => sum + parseInt(item.price), 0)
			order.pizzaType = order.items.map(item => item.name).join(", ")
			this.repository._saveToStorage()
			EventBus.emit(OrderEvents.ORDER_ITEM_REMOVED, { order, orderId, itemIndex, removedItem })
			return removedItem
		}
		return null
	}

	addItemsToOrder(orderId, newItems) {
		const order = this.repository.orders.find(o => o.id === orderId)
		if (order && newItems && newItems.length > 0) {
			const itemsWithDefaults = newItems.map(item => ({
				...item,
				served: false
			}))
			order.items.push(...itemsWithDefaults)
			order.price = order.items.reduce((sum, item) => sum + parseInt(item.price), 0)
			order.pizzaType = order.items.map(item => item.name).join(", ")
			this.repository._saveToStorage()
			EventBus.emit(OrderEvents.ORDER_ITEMS_ADDED, { order, orderId, addedItems: itemsWithDefaults })
			return itemsWithDefaults
		}
		return null
	}

	markItemAsServed(orderId, itemIndex) {
		const order = this.repository.orders.find(o => o.id === orderId)
		if (order && order.items && order.items[itemIndex]) {
			const item = order.items[itemIndex]
			item.served = true
			this.repository._saveToStorage()
			EventBus.emit(OrderEvents.ORDER_ITEM_SERVED, { order, orderId, itemIndex, item })
			return true
		}
		return false
	}

	markItemAsUnserved(orderId, itemIndex) {
		const order = this.repository.orders.find(o => o.id === orderId)
		if (order && order.items && order.items[itemIndex]) {
			const item = order.items[itemIndex]
			item.served = false
			this.repository._saveToStorage()
			EventBus.emit(OrderEvents.ORDER_ITEM_UNSERVED, { order, orderId, itemIndex, item })
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
