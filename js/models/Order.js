/**
 * Order model with factory method for creation
 * Provides type documentation and validation
 */
export class Order {
	constructor(data) {
		// Required fields
		this.id = data.id
		this.orderNo = data.orderNo
		this.timestamp = data.timestamp
		this.time = data.time
		this.pizzaType = data.pizzaType
		this.items = data.items || []
		this.price = data.price
		this.eatType = data.eatType

		// Status fields with defaults
		this.served = data.served ?? false
		this.servedAt = data.servedAt ?? null
		this.paid = data.paid ?? false
		this.paidAt = data.paidAt ?? null
		this.paymentType = data.paymentType ?? null

		// Optional fields
		this.tableNumber = data.tableNumber ?? null
		this.soundIndicator = data.soundIndicator ?? null
		this.customerDescription = data.customerDescription ?? null
	}

	/**
	 * Factory method for creating new orders
	 * @param {Object} orderData - Order data from UI
	 * @param {number} orderNo - Sequential order number
	 * @returns {Order}
	 */
	static create(orderData, orderNo) {
		const now = Date.now()
		return new Order({
			...orderData,
			id: now,
			orderNo: orderNo,
			timestamp: now,
			time: new Date().toLocaleTimeString(),
			served: false,
			servedAt: null,
			paidAt: orderData.paid ? now : null,
		})
	}

	/**
	 * Convert from plain object (for deserialization from storage)
	 * @param {Object} json - Plain object from storage
	 * @returns {Order}
	 */
	static fromJSON(json) {
		return new Order(json)
	}

	/**
	 * Convert to plain object (for serialization to storage)
	 * Maintains exact same format as original inline objects
	 * @returns {Object}
	 */
	toJSON() {
		return {
			id: this.id,
			orderNo: this.orderNo,
			timestamp: this.timestamp,
			time: this.time,
			served: this.served,
			servedAt: this.servedAt,
			paid: this.paid,
			paidAt: this.paidAt,
			paymentType: this.paymentType,
			pizzaType: this.pizzaType,
			items: this.items,
			price: this.price,
			eatType: this.eatType,
			tableNumber: this.tableNumber,
			soundIndicator: this.soundIndicator,
			customerDescription: this.customerDescription,
		}
	}

	/**
	 * Check if order is completed (served AND paid)
	 * @returns {boolean}
	 */
	isCompleted() {
		return this.served && this.paid
	}

	/**
	 * Check if order is ongoing (not completed)
	 * @returns {boolean}
	 */
	isOngoing() {
		return !this.served || (this.served && !this.paid)
	}
}
