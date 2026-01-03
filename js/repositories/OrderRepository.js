/**
 * Abstract repository interface for order persistence
 * Defines contract that all storage implementations must follow
 */
export class OrderRepository {
	constructor() {
		if (this.constructor === OrderRepository) {
			throw new Error("OrderRepository is abstract and cannot be instantiated directly")
		}
	}

	// === CRUD Operations ===

	/** Save or update an order */
	save(order) {
		throw new Error("Method not implemented")
	}

	/** Delete an order by ID */
	delete(orderId) {
		throw new Error("Method not implemented")
	}

	/** Find order by ID */
	findById(orderId) {
		throw new Error("Method not implemented")
	}

	// === Query Operations ===

	/** Get all orders */
	findAll() {
		throw new Error("Method not implemented")
	}

	/** Get ongoing orders (not completed) */
	findOngoing() {
		throw new Error("Method not implemented")
	}

	/** Get completed orders (served AND paid) */
	findCompleted() {
		throw new Error("Method not implemented")
	}

	/** Get orders in date range */
	findByDateRange(startTimestamp, endTimestamp) {
		throw new Error("Method not implemented")
	}

	// === Counter Management ===

	/** Get current order counter value */
	getOrderCounter() {
		throw new Error("Method not implemented")
	}

	/** Increment and return new counter value */
	incrementOrderCounter() {
		throw new Error("Method not implemented")
	}

	// === Batch Operations ===

	/** Import orders (for backup restore) */
	importOrders(orders, orderCounter) {
		throw new Error("Method not implemented")
	}

	/** Clear all data */
	clearAll() {
		throw new Error("Method not implemented")
	}
}
