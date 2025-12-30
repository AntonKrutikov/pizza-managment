// Analytics module for Pizza Shop POS
export class Analytics {
	constructor(orderService) {
		this.orderService = orderService
	}

	// Get all completed orders (served and paid)
	getAllCompletedOrders() {
		return this.orderService.orders.filter((o) => o.served && o.paid)
	}

	// Get orders for a specific date range
	getOrdersInRange(startDate, endDate) {
		const start = new Date(startDate).setHours(0, 0, 0, 0)
		const end = new Date(endDate).setHours(23, 59, 59, 999)
		return this.getAllCompletedOrders().filter((o) => {
			return o.timestamp >= start && o.timestamp <= end
		})
	}

	// Get today's orders
	getTodayOrders() {
		const today = new Date()
		return this.getOrdersInRange(today, today)
	}

	// Get this week's orders (Sunday to Saturday)
	getWeekOrders() {
		const today = new Date()
		const dayOfWeek = today.getDay()
		const startOfWeek = new Date(today)
		startOfWeek.setDate(today.getDate() - dayOfWeek)
		return this.getOrdersInRange(startOfWeek, today)
	}

	// Get this month's orders
	getMonthOrders() {
		const today = new Date()
		const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
		return this.getOrdersInRange(startOfMonth, today)
	}

	// Calculate statistics for a set of orders
	calculateStats(orders) {
		const stats = {
			totalOrders: orders.length,
			totalRevenue: 0,
			averageOrderValue: 0,
			itemsSold: 0,
			topItems: {},
			ordersByType: { "eat-in": 0, "take-away": 0 },
			ordersByHour: {},
			paymentStats: { paidOnOrder: 0, paidLater: 0 },
			categoryBreakdown: {},
		}

		if (orders.length === 0) return stats

		orders.forEach((order) => {
			// Total revenue
			stats.totalRevenue += parseInt(order.price) || 0

			// Order type breakdown
			if (order.eatType) {
				stats.ordersByType[order.eatType] = (stats.ordersByType[order.eatType] || 0) + 1
			}

			// Orders by hour
			const hour = new Date(order.timestamp).getHours()
			stats.ordersByHour[hour] = (stats.ordersByHour[hour] || 0) + 1

			// Items breakdown
			if (order.items && Array.isArray(order.items)) {
				order.items.forEach((item) => {
					stats.itemsSold++
					const itemName = item.name.split(" (")[0] // Remove size variant
					stats.topItems[itemName] = (stats.topItems[itemName] || 0) + 1

					// Category breakdown - check image path first, then item name
					let category = "Other"
					if (item.image) {
						if (item.image.includes("pizza")) category = "Pizza"
						else if (item.image.includes("quesadilla")) category = "Quesadilla"
					} else {
						// Fallback: detect category from item name for older orders without images
						const lowerName = itemName.toLowerCase()
						// Known pizza names
						const pizzaNames = ["margherita", "prosciutto", "salame", "formaggi", "vegetariana", "funghi", "capricciosa", "bianca", "chicken", "sausage", "tuna", "hawaiian", "custom"]
						// Known quesadilla names
						const quesadillaNames = ["cheese", "beef", "ham", "spinach", "mushroom", "pepperoni", "nutella"]

						if (pizzaNames.some(name => lowerName.includes(name))) {
							category = "Pizza"
						} else if (quesadillaNames.some(name => lowerName.includes(name)) && !lowerName.includes("pizza")) {
							category = "Quesadilla"
						}
					}
					if (!stats.categoryBreakdown[category]) {
						stats.categoryBreakdown[category] = { count: 0, revenue: 0 }
					}
					stats.categoryBreakdown[category].count++
					stats.categoryBreakdown[category].revenue += parseInt(item.price) || 0
				})
			}
		})

		// Calculate average order value
		stats.averageOrderValue = stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0

		// Sort top items
		stats.topItemsSorted = Object.entries(stats.topItems)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)

		return stats
	}

	// Get daily stats
	getDailyStats() {
		return this.calculateStats(this.getTodayOrders())
	}

	// Get weekly stats
	getWeeklyStats() {
		return this.calculateStats(this.getWeekOrders())
	}

	// Get monthly stats
	getMonthlyStats() {
		return this.calculateStats(this.getMonthOrders())
	}

	// Get comparison with previous period
	getComparison(currentOrders, previousOrders) {
		const current = this.calculateStats(currentOrders)
		const previous = this.calculateStats(previousOrders)

		const calcChange = (curr, prev) => {
			if (prev === 0) return curr > 0 ? 100 : 0
			return Math.round(((curr - prev) / prev) * 100)
		}

		return {
			revenueChange: calcChange(current.totalRevenue, previous.totalRevenue),
			ordersChange: calcChange(current.totalOrders, previous.totalOrders),
			avgOrderChange: calcChange(current.averageOrderValue, previous.averageOrderValue),
		}
	}

	// Get yesterday's orders for comparison
	getYesterdayOrders() {
		const yesterday = new Date()
		yesterday.setDate(yesterday.getDate() - 1)
		return this.getOrdersInRange(yesterday, yesterday)
	}

	// Get last week's orders for comparison
	getLastWeekOrders() {
		const today = new Date()
		const dayOfWeek = today.getDay()
		const endOfLastWeek = new Date(today)
		endOfLastWeek.setDate(today.getDate() - dayOfWeek - 1)
		const startOfLastWeek = new Date(endOfLastWeek)
		startOfLastWeek.setDate(endOfLastWeek.getDate() - 6)
		return this.getOrdersInRange(startOfLastWeek, endOfLastWeek)
	}

	// Get last month's orders for comparison
	getLastMonthOrders() {
		const today = new Date()
		const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
		const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
		return this.getOrdersInRange(startOfLastMonth, endOfLastMonth)
	}

	// Get daily breakdown for current week
	getWeeklyBreakdown() {
		const days = []
		const today = new Date()
		const dayOfWeek = today.getDay()

		for (let i = 0; i <= dayOfWeek; i++) {
			const date = new Date(today)
			date.setDate(today.getDate() - dayOfWeek + i)
			const dayOrders = this.getOrdersInRange(date, date)
			const stats = this.calculateStats(dayOrders)
			days.push({
				date: date.toLocaleDateString("en-US", { weekday: "short" }),
				orders: stats.totalOrders,
				revenue: stats.totalRevenue,
			})
		}

		return days
	}

	// Get hourly breakdown for today
	getHourlyBreakdown() {
		const todayOrders = this.getTodayOrders()
		const hours = {}

		// Initialize all hours
		for (let i = 0; i < 24; i++) {
			hours[i] = { orders: 0, revenue: 0 }
		}

		todayOrders.forEach((order) => {
			const hour = new Date(order.timestamp).getHours()
			hours[hour].orders++
			hours[hour].revenue += parseInt(order.price) || 0
		})

		return hours
	}

	// Get peak hours
	getPeakHours() {
		const hourly = this.getHourlyBreakdown()
		return Object.entries(hourly)
			.map(([hour, data]) => ({ hour: parseInt(hour), ...data }))
			.sort((a, b) => b.orders - a.orders)
			.slice(0, 3)
	}
}

// SVG Pie Chart Generator
export function generatePieChart(data, size = 150) {
	if (!data || data.length === 0) {
		return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
			<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 10}" fill="#eee"/>
			<text x="${size / 2}" y="${size / 2}" text-anchor="middle" dy="0.3em" fill="#999" font-size="12">No data</text>
		</svg>`
	}

	const total = data.reduce((sum, item) => sum + item.value, 0)
	if (total === 0) {
		return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
			<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 10}" fill="#eee"/>
			<text x="${size / 2}" y="${size / 2}" text-anchor="middle" dy="0.3em" fill="#999" font-size="12">No data</text>
		</svg>`
	}

	const centerX = size / 2
	const centerY = size / 2
	const radius = size / 2 - 10

	let currentAngle = -Math.PI / 2 // Start from top
	let paths = ""

	const colors = ["#D35400", "#27AE60", "#3498DB", "#9B59B6", "#E74C3C", "#F39C12", "#1ABC9C", "#34495E"]

	data.forEach((item, index) => {
		const sliceAngle = (item.value / total) * 2 * Math.PI
		const endAngle = currentAngle + sliceAngle

		const x1 = centerX + radius * Math.cos(currentAngle)
		const y1 = centerY + radius * Math.sin(currentAngle)
		const x2 = centerX + radius * Math.cos(endAngle)
		const y2 = centerY + radius * Math.sin(endAngle)

		const largeArcFlag = sliceAngle > Math.PI ? 1 : 0
		const color = colors[index % colors.length]

		paths += `<path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z" fill="${color}" stroke="#fff" stroke-width="2"/>`

		currentAngle = endAngle
	})

	return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${paths}</svg>`
}

// Generate legend for pie chart
export function generateLegend(data) {
	const colors = ["#D35400", "#27AE60", "#3498DB", "#9B59B6", "#E74C3C", "#F39C12", "#1ABC9C", "#34495E"]
	const total = data.reduce((sum, item) => sum + item.value, 0)

	return data
		.map((item, index) => {
			const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0
			const color = colors[index % colors.length]
			return `<div class="legend-item">
				<span class="legend-color" style="background: ${color}"></span>
				<span class="legend-label">${item.label}</span>
				<span class="legend-value">${item.value} (${percentage}%)</span>
			</div>`
		})
		.join("")
}

// Generate bar chart
export function generateBarChart(data, width = 300, height = 150) {
	if (!data || data.length === 0) {
		return `<svg width="${width}" height="${height}">
			<text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="#999">No data</text>
		</svg>`
	}

	// Calculate dynamic width based on number of items
	const minBarWidth = 25
	const gap = 4
	const padding = 20
	const labelSpace = 50 // Space for rotated labels at bottom
	const calculatedWidth = Math.max(width, data.length * (minBarWidth + gap) + padding * 2)

	const maxValue = Math.max(...data.map((d) => d.value), 1)
	const barWidth = Math.max(minBarWidth, (calculatedWidth - padding * 2) / data.length - gap)
	const chartHeight = height - labelSpace // Space for rotated labels

	let bars = ""
	data.forEach((item, index) => {
		const barHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0
		const x = padding + index * (barWidth + gap)
		const y = chartHeight - barHeight + 10

		// Bar
		bars += `<rect x="${x}" y="${y}" width="${barWidth}" height="${Math.max(barHeight, 1)}" fill="#D35400" rx="2"/>`

		// Rotated label - positioned below the chart area
		const labelX = x + barWidth / 2
		const labelY = chartHeight + 20
		bars += `<text x="${labelX}" y="${labelY}" text-anchor="end" font-size="9" fill="#666" transform="rotate(-45 ${labelX} ${labelY})">${item.label}</text>`

		// Value on top of bar
		if (item.value > 0) {
			bars += `<text x="${x + barWidth / 2}" y="${y - 3}" text-anchor="middle" font-size="9" fill="#333">${item.value}</text>`
		}
	})

	return `<svg width="${calculatedWidth}" height="${height}" style="min-width: ${calculatedWidth}px">${bars}</svg>`
}
