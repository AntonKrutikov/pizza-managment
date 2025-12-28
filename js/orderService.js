export class OrderService {
	constructor() {
		this.orders = []
		this.orderCounter = 0
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
	}

	markAsServed(orderId) {
		const order = this.orders.find((o) => o.id === orderId)
		if (order) {
			order.served = true
		}
	}

	getOrders() {
		// Return only unserved orders, sorted by time received (oldest first)
		return this.orders.filter((o) => !o.served).slice()
	}

	getServedOrders() {
		// Return only served orders, sorted by most recent first
		return this.orders.filter((o) => o.served).slice().reverse()
	}

	getElapsedTime(timestamp) {
		const elapsed = Date.now() - timestamp
		const minutes = Math.floor(elapsed / 60000)
		const seconds = Math.floor((elapsed % 60000) / 1000)
		return `${minutes}:${seconds.toString().padStart(2, "0")}`
	}
}
