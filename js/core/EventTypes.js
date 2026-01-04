/**
 * Event type constants for the EventBus
 * Namespaced by domain (order:*, orders:*)
 */
export const OrderEvents = {
	// Order lifecycle
	ORDER_CREATED: 'order:created',
	ORDER_DELETED: 'order:deleted',
	ORDER_RESTORED: 'order:restored',

	// Status changes
	ORDER_SERVED: 'order:served',
	ORDER_UNSERVED: 'order:unserved',
	ORDER_PAID: 'order:paid',
	ORDER_UNPAID: 'order:unpaid',
	ORDER_COMPLETED: 'order:completed', // Both served && paid

	// Property updates
	ORDER_UPDATED: 'order:updated', // table, eatType, sound changes

	// Item-level events
	ORDER_ITEM_SERVED: 'order:item:served',
	ORDER_ITEM_UNSERVED: 'order:item:unserved',
	ORDER_ITEM_REMOVED: 'order:item:removed',

	// Bulk operations
	ORDERS_IMPORTED: 'orders:imported',
	ORDERS_CLEARED: 'orders:cleared'
}
