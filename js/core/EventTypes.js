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
	ORDER_ITEMS_ADDED: 'order:items:added',

	// Bulk operations
	ORDERS_IMPORTED: 'orders:imported',
	ORDERS_CLEARED: 'orders:cleared'
}

export const InventoryEvents = {
	// Dough tracking
	DOUGH_COUNT_SET: 'inventory:dough:set',
	DOUGH_DEDUCTED: 'inventory:dough:deducted',
	DOUGH_ADJUSTED: 'inventory:dough:adjusted',

	// Tracking control
	TRACKING_ENABLED: 'inventory:tracking:enabled',
	TRACKING_DISABLED: 'inventory:tracking:disabled',

	// Stock alerts
	STOCK_LOW: 'inventory:stock:low',
	STOCK_CRITICAL: 'inventory:stock:critical',
	STOCK_OUT: 'inventory:stock:out',
	STOCK_NORMAL: 'inventory:stock:normal'
}
