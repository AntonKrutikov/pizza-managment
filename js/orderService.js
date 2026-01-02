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
		const newOrder = {
			...order,
			id: Date.now(),
			orderNo: this.orderCounter,
			timestamp: Date.now(),
			time: new Date().toLocaleTimeString(),
			served: false,
		}
		this.orders.push(newOrder)
		this.saveToStorage()
		return newOrder
	}

	markAsServed(orderId) {
		const order = this.orders.find((o) => o.id === orderId)
		if (order) {
			order.served = true
			this.saveToStorage()
		}
	}

	markAsUnserved(orderId) {
		const order = this.orders.find((o) => o.id === orderId)
		if (order) {
			order.served = false
			this.saveToStorage()
		}
	}

	markAsPaid(orderId) {
		const order = this.orders.find((o) => o.id === orderId)
		if (order) {
			order.paid = true
			this.saveToStorage()
		}
	}

	markAsUnpaid(orderId) {
		const order = this.orders.find((o) => o.id === orderId)
		if (order) {
			order.paid = false
			this.saveToStorage()
		}
	}

	restoreToOngoing(orderId) {
		const order = this.orders.find((o) => o.id === orderId)
		if (order) {
			order.served = false
			order.paid = false
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
