export class OrderService {
	constructor() {
		this.loadFromStorage()
	}

	loadFromStorage() {
		const saved = localStorage.getItem('pizzaShopOrders')
		if (saved) {
			const data = JSON.parse(saved)
			this.orders = data.orders || []
			this.orderCounter = data.orderCounter || 0
		} else {
			this.orders = []
			this.orderCounter = 0
		}
	}

	saveToStorage() {
		const data = {
			orders: this.orders,
			orderCounter: this.orderCounter
		}
		localStorage.setItem('pizzaShopOrders', JSON.stringify(data))
	}

	addOrder(order) {
		this.orderCounter++
		const now = Date.now()
		const newOrder = {
			...order,
			id: now,
			orderNo: this.orderCounter,
			timestamp: now,
			time: new Date().toLocaleTimeString(),
			served: false,
			servedAt: null,
			paidAt: order.paid ? now : null,
		}
		this.orders.push(newOrder)
		this.saveToStorage()
		return newOrder
	}

	markAsServed(orderId) {
		const order = this.orders.find((o) => o.id === orderId)
		if (order) {
			order.served = true
			order.servedAt = Date.now()
			this.saveToStorage()
		}
	}

	markAsUnserved(orderId) {
		const order = this.orders.find((o) => o.id === orderId)
		if (order) {
			order.served = false
			order.servedAt = null
			this.saveToStorage()
		}
	}

	markAsPaid(orderId, paymentType = null) {
		const order = this.orders.find((o) => o.id === orderId)
		if (order) {
			order.paid = true
			order.paidAt = Date.now()
			if (paymentType) {
				order.paymentType = paymentType
			}
			this.saveToStorage()
		}
	}

	markAsUnpaid(orderId) {
		const order = this.orders.find((o) => o.id === orderId)
		if (order) {
			order.paid = false
			order.paidAt = null
			order.paymentType = null
			this.saveToStorage()
		}
	}

	restoreToOngoing(orderId) {
		const order = this.orders.find((o) => o.id === orderId)
		if (order) {
			order.served = false
			order.servedAt = null
			order.paid = false
			order.paidAt = null
			order.paymentType = null
			this.saveToStorage()
		}
	}

	removeOrder(orderId) {
		const index = this.orders.findIndex((o) => o.id === orderId)
		if (index !== -1) {
			this.orders.splice(index, 1)
			this.saveToStorage()
		}
	}

	// Update order eat type (eat-in or take-away)
	updateEatType(orderId, eatType) {
		const order = this.orders.find((o) => o.id === orderId)
		if (order) {
			order.eatType = eatType
			this.saveToStorage()
		}
	}

	// Update order table number
	updateTableNumber(orderId, tableNumber) {
		const order = this.orders.find((o) => o.id === orderId)
		if (order) {
			order.tableNumber = tableNumber
			this.saveToStorage()
		}
	}

	// Update order sound indicator
	updateSoundIndicator(orderId, soundIndicator) {
		const order = this.orders.find((o) => o.id === orderId)
		if (order) {
			order.soundIndicator = soundIndicator
			this.saveToStorage()
		}
	}

	// Remove item from order and recalculate price
	removeItemFromOrder(orderId, itemIndex) {
		const order = this.orders.find((o) => o.id === orderId)
		if (order && order.items && order.items[itemIndex]) {
			const removedItem = order.items.splice(itemIndex, 1)[0]
			order.price = order.items.reduce((sum, item) => sum + parseInt(item.price), 0)
			order.pizzaType = order.items.map(item => item.name).join(", ")
			this.saveToStorage()
			return removedItem
		}
		return null
	}

	// Mark individual item as served
	markItemAsServed(orderId, itemIndex) {
		const order = this.orders.find((o) => o.id === orderId)
		if (order && order.items && order.items[itemIndex]) {
			order.items[itemIndex].served = true
			this.saveToStorage()
			return true
		}
		return false
	}

	// Mark individual item as unserved
	markItemAsUnserved(orderId, itemIndex) {
		const order = this.orders.find((o) => o.id === orderId)
		if (order && order.items && order.items[itemIndex]) {
			order.items[itemIndex].served = false
			this.saveToStorage()
			return true
		}
		return false
	}

	getOrders() {
		// Return orders that are not completed (completed = served AND paid)
		// This includes: unserved orders AND served-but-unpaid orders
		return this.orders.filter((o) => !o.served || (o.served && !o.paid)).slice()
	}

	getServedOrders() {
		// Return only completed orders (served AND paid), sorted by most recent first
		return this.orders.filter((o) => o.served && o.paid).slice().reverse()
	}

	getElapsedTime(timestamp) {
		const elapsed = Date.now() - timestamp
		const minutes = Math.floor(elapsed / 60000)
		const seconds = Math.floor((elapsed % 60000) / 1000)
		return `${minutes}:${seconds.toString().padStart(2, "0")}`
	}
}
