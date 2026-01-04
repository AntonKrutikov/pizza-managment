/**
 * EventBus - Minimal pub/sub with async handler support
 * Singleton pattern - import and use directly
 */
class EventBusClass {
	constructor() {
		this._handlers = new Map() // eventType -> Map(handlerId -> handler)
		this._handlerIdCounter = 0
	}

	/**
	 * Subscribe to an event
	 * @param {string} eventType - Event type from EventTypes
	 * @param {Function} handler - Handler function (can be async)
	 * @returns {number} Handler ID for unsubscribe
	 */
	subscribe(eventType, handler) {
		if (!this._handlers.has(eventType)) {
			this._handlers.set(eventType, new Map())
		}

		const handlerId = ++this._handlerIdCounter
		this._handlers.get(eventType).set(handlerId, handler)

		return handlerId
	}

	/**
	 * Unsubscribe a handler by ID
	 * @param {string} eventType - Event type
	 * @param {number} handlerId - Handler ID from subscribe
	 * @returns {boolean} True if handler was found and removed
	 */
	unsubscribe(eventType, handlerId) {
		const typeHandlers = this._handlers.get(eventType)
		if (typeHandlers) {
			return typeHandlers.delete(handlerId)
		}
		return false
	}

	/**
	 * Emit an event and wait for all handlers to complete
	 * @param {string} eventType - Event type
	 * @param {Object} payload - Event data
	 * @returns {Promise<void>} Resolves when all handlers complete
	 */
	async emit(eventType, payload = {}) {
		const typeHandlers = this._handlers.get(eventType)
		if (!typeHandlers || typeHandlers.size === 0) {
			return
		}

		const handlers = Array.from(typeHandlers.values())
		await Promise.all(
			handlers.map((handler) => {
				try {
					const result = handler(payload)
					return result instanceof Promise ? result : Promise.resolve()
				} catch (error) {
					console.error(`EventBus handler error for ${eventType}:`, error)
					return Promise.resolve()
				}
			})
		)
	}

	/**
	 * Check if an event has subscribers
	 * @param {string} eventType - Event type
	 * @returns {boolean}
	 */
	hasSubscribers(eventType) {
		const typeHandlers = this._handlers.get(eventType)
		return typeHandlers && typeHandlers.size > 0
	}

	/**
	 * Remove all handlers for an event type
	 * @param {string} eventType - Event type
	 */
	clearEvent(eventType) {
		this._handlers.delete(eventType)
	}

	/**
	 * Remove all handlers (for testing/cleanup)
	 */
	clearAll() {
		this._handlers.clear()
	}
}

// Singleton export
const EventBus = new EventBusClass()
export default EventBus
