import { OrderService } from "./js/orderService.js"
import { renderOrders, renderHistoryOrders } from "./js/orderList.js"
import { Analytics, generatePieChart, generateLegend, generateBarChart } from "./js/analytics.js"

const orderService = new OrderService()
const analytics = new Analytics(orderService)

const orderForm = document.getElementById("order-form")
const ordersList = document.getElementById("orders-list")
const historyList = document.getElementById("history-list")
const navTabs = document.querySelectorAll(".nav-tab")
const screens = document.querySelectorAll(".screen")

// Menu state
let menuData = null
let currentCategory = null
let selectedItem = null

// Load menu data and display all categories
async function loadMenu() {
	try {
		const response = await fetch("data/menu.json")
		menuData = await response.json()

		const menuContainer = document.getElementById("menu-items-container")
		menuContainer.innerHTML = ""

		// Display all categories in sequence
		menuData.categories.forEach((category) => {
			// Create category header
			const categoryHeader = document.createElement("h3")
			categoryHeader.classList.add("category-header")
			categoryHeader.textContent = category.name
			menuContainer.appendChild(categoryHeader)

			// Create items grid for this category
			const itemsGrid = document.createElement("div")
			itemsGrid.classList.add("menu-items-grid")

			category.items.forEach((item) => {
				const card = createMenuItemCard(item)
				itemsGrid.appendChild(card)
			})

			menuContainer.appendChild(itemsGrid)
		})
	} catch (error) {
		console.error("Error loading menu:", error)
	}
}

// Create a menu item card
function createMenuItemCard(item) {
	const card = document.createElement("div")
	card.classList.add("menu-item-card")

	// Add special class for custom price items
	if (item.customPrice) {
		card.classList.add("custom-price-card")
	}

	// Add image if available
	if (item.image) {
		const img = document.createElement("img")
		img.src = item.image
		img.alt = item.name
		img.classList.add("item-image")
		card.appendChild(img)
	}

	const nameSpan = document.createElement("span")
	nameSpan.classList.add("item-name")
	nameSpan.textContent = item.name

	const priceSpan = document.createElement("span")
	priceSpan.classList.add("item-price")

	// Display price or price range
	if (item.customPrice) {
		priceSpan.textContent = "Custom"
	} else if (item.variants) {
		const prices = item.variants.map((v) => v.price)
		const minPrice = Math.min(...prices)
		const maxPrice = Math.max(...prices)
		priceSpan.textContent = minPrice === maxPrice ? `${minPrice} THB` : `${minPrice}-${maxPrice} THB`
	} else {
		priceSpan.textContent = `${item.price} THB`
	}

	card.appendChild(nameSpan)
	card.appendChild(priceSpan)

	// Add action buttons container (initially hidden)
	const actionsDiv = document.createElement("div")
	actionsDiv.classList.add("item-actions")

	if (item.customPrice) {
		// For custom price items, show popup on click
		const btn = document.createElement("button")
		btn.type = "button"
		btn.classList.add("add-item-btn-card")
		btn.textContent = "Set Price"
		btn.addEventListener("click", function (e) {
			e.stopPropagation()
			showCustomPricePopup(item.name, item.image, card)
		})
		actionsDiv.appendChild(btn)
	} else if (item.variants) {
		// For items with variants, add buttons for each variant
		item.variants.forEach((variant) => {
			const btn = document.createElement("button")
			btn.type = "button"
			btn.classList.add("add-variant-btn")
			btn.textContent = `Add ${variant.size}`
			btn.addEventListener("click", function (e) {
				e.stopPropagation() // Prevent card click event
				addItemToOrder(`${item.name} (${variant.size})`, variant.price, item.image)
				// Deselect card after adding
				card.classList.remove("selected")
			})
			actionsDiv.appendChild(btn)
		})
	} else {
		// For items with single price, add single "Add" button
		const btn = document.createElement("button")
		btn.type = "button"
		btn.classList.add("add-item-btn-card")
		btn.textContent = "Add"
		btn.addEventListener("click", function (e) {
			e.stopPropagation() // Prevent card click event
			addItemToOrder(item.name, item.price, item.image)
			// Deselect card after adding
			card.classList.remove("selected")
		})
		actionsDiv.appendChild(btn)
	}

	card.appendChild(actionsDiv)

	// Handle card selection
	card.addEventListener("click", function () {
		// Deselect all other cards
		document.querySelectorAll(".menu-item-card").forEach((c) => c.classList.remove("selected"))
		// Select this card
		card.classList.add("selected")
	})

	return card
}

// Add item to order (helper function)
function addItemToOrder(displayName, price, image) {
	currentOrderItems.push({
		name: displayName,
		price: price,
		image: image || null,
	})

	updateCurrentOrderDisplay()
	checkSendOrderReady()
	updateFloatingButton()
}

// Custom price popup handling
let currentCustomItemName = null
let currentCustomItemImage = null
let currentCustomCard = null

function showCustomPricePopup(itemName, itemImage, card) {
	currentCustomItemName = itemName
	currentCustomItemImage = itemImage
	currentCustomCard = card

	const popup = document.getElementById("custom-price-popup")
	const input = document.getElementById("custom-price-input")
	const confirmBtn = document.getElementById("custom-price-confirm")

	// Reset input
	input.value = ""
	confirmBtn.disabled = true

	// Show popup
	popup.style.display = "flex"

	// Focus input after a short delay (for mobile keyboards)
	setTimeout(() => input.focus(), 100)
}

function hideCustomPricePopup() {
	const popup = document.getElementById("custom-price-popup")
	popup.style.display = "none"

	// Deselect card
	if (currentCustomCard) {
		currentCustomCard.classList.remove("selected")
	}

	currentCustomItemName = null
	currentCustomItemImage = null
	currentCustomCard = null
}

// Custom price popup event listeners
document.getElementById("custom-price-input").addEventListener("input", function () {
	const confirmBtn = document.getElementById("custom-price-confirm")
	const value = parseInt(this.value)
	confirmBtn.disabled = !value || value <= 0
})

document.getElementById("custom-price-cancel").addEventListener("click", hideCustomPricePopup)

document.getElementById("custom-price-confirm").addEventListener("click", function () {
	const input = document.getElementById("custom-price-input")
	const price = parseInt(input.value)

	if (price && price > 0 && currentCustomItemName) {
		addItemToOrder(currentCustomItemName, price, currentCustomItemImage)
		hideCustomPricePopup()
	}
})

// Close popup on overlay click
document.getElementById("custom-price-popup").addEventListener("click", function (e) {
	if (e.target === this) {
		hideCustomPricePopup()
	}
})

// Handle Enter key in custom price input
document.getElementById("custom-price-input").addEventListener("keydown", function (e) {
	if (e.key === "Enter") {
		const confirmBtn = document.getElementById("custom-price-confirm")
		if (!confirmBtn.disabled) {
			confirmBtn.click()
		}
	}
	if (e.key === "Escape") {
		hideCustomPricePopup()
	}
})

// Track if current order section is in viewport
let isOrderSectionVisible = false

// Update floating button visibility and count
function updateFloatingButton() {
	const floatingBtn = document.getElementById("goto-order-btn")
	const cartCount = floatingBtn.querySelector(".cart-count")

	// Show button only if there are items AND section is not visible
	if (currentOrderItems.length > 0 && !isOrderSectionVisible) {
		const totalPrice = currentOrderItems.reduce((sum, item) => sum + parseInt(item.price), 0)
		floatingBtn.style.display = "flex"
		cartCount.textContent = `${currentOrderItems.length} - ${totalPrice} THB`
	} else {
		floatingBtn.style.display = "none"
	}
}

// Set up Intersection Observer to track when order section is visible
const orderSection = document.getElementById("current-order-section")
const observer = new IntersectionObserver(
	(entries) => {
		entries.forEach((entry) => {
			isOrderSectionVisible = entry.isIntersecting
			updateFloatingButton()
		})
	},
	{
		threshold: 0.1, // Trigger when at least 10% of the section is visible
	}
)

// Start observing the order section
observer.observe(orderSection)

// Handle floating button click - scroll to order section
document.getElementById("goto-order-btn").addEventListener("click", function () {
	orderSection.scrollIntoView({ behavior: "smooth", block: "start" })
})

// Load menu on page load
loadMenu()

// Current order state
let currentOrderItems = []

function updateOrders() {
	const orders = orderService.getOrders()
	renderOrders(orders, ordersList, orderService)
	updateOrdersBadge(orders.length)
}

function updateOrdersBadge(count) {
	const navBadge = document.getElementById("ongoing-orders-badge")
	const headerBadge = document.getElementById("ongoing-orders-header-badge")

	if (count > 0) {
		navBadge.textContent = count
		navBadge.style.display = "inline"
		headerBadge.textContent = count
		headerBadge.style.display = "inline"
	} else {
		navBadge.style.display = "none"
		headerBadge.style.display = "none"
	}
}

function updateHistory() {
	const servedOrders = orderService.getServedOrders()
	renderHistoryOrders(servedOrders, historyList, orderService)
}

function updateTimers() {
	const timers = document.querySelectorAll(".order-timer")
	timers.forEach((timer) => {
		const orderId = parseInt(timer.dataset.orderId)
		const order = orderService.orders.find((o) => o.id === orderId)
		if (order) {
			timer.textContent = orderService.getElapsedTime(order.timestamp)
		}
	})
}

function updateCurrentOrderDisplay() {
	const currentOrderSection = document.getElementById("current-order-section")
	const currentOrderItemsList = document.getElementById("current-order-items")
	const orderTotalAmount = document.getElementById("order-total-amount")
	const orderOptions = document.getElementById("order-options")

	if (currentOrderItems.length === 0) {
		currentOrderSection.style.display = "none"
		orderOptions.style.display = "none"
		return
	}

	// Show current order section
	currentOrderSection.style.display = "block"
	orderOptions.style.display = "block"

	// Render items
	currentOrderItemsList.innerHTML = ""
	let total = 0

	currentOrderItems.forEach((item, index) => {
		const li = document.createElement("li")
		li.classList.add("current-order-item")

		const itemText = document.createElement("span")
		itemText.textContent = `${item.name} - ${item.price} THB`

		const removeBtn = document.createElement("button")
		removeBtn.textContent = "Remove"
		removeBtn.classList.add("remove-item-btn")
		removeBtn.addEventListener("click", () => {
			currentOrderItems.splice(index, 1)
			updateCurrentOrderDisplay()
			checkSendOrderReady()
		})

		li.appendChild(itemText)
		li.appendChild(removeBtn)
		currentOrderItemsList.appendChild(li)

		total += parseInt(item.price)
	})

	orderTotalAmount.textContent = total
	updateFloatingButton()
}

const sendOrderBtn = document.getElementById("send-order")

function checkSendOrderReady() {
	const paidSelected = document.querySelector('input[name="paid"]:checked')
	const eatTypeSelected = document.querySelector('input[name="eatType"]:checked')

	sendOrderBtn.disabled = !(currentOrderItems.length > 0 && paidSelected && eatTypeSelected)
}

// Table number and sound indicator are always visible now
// No need to show/hide based on eat type

// Handle table number button clicks
document.getElementById("table-number-grid").addEventListener("click", function (e) {
	if (e.target.classList.contains("number-btn")) {
		// Toggle selection - clicking the same button deselects it
		if (e.target.classList.contains("selected")) {
			e.target.classList.remove("selected")
		} else {
			// Deselect all other buttons first
			document.querySelectorAll("#table-number-grid .number-btn").forEach((btn) => {
				btn.classList.remove("selected")
			})
			// Select clicked button
			e.target.classList.add("selected")
		}
	}
})

// Handle sound indicator button clicks
document.getElementById("sound-indicator-grid").addEventListener("click", function (e) {
	if (e.target.classList.contains("number-btn")) {
		// Toggle selection - clicking the same button deselects it
		if (e.target.classList.contains("selected")) {
			e.target.classList.remove("selected")
		} else {
			// Deselect all other buttons first
			document.querySelectorAll("#sound-indicator-grid .number-btn").forEach((btn) => {
				btn.classList.remove("selected")
			})
			// Select clicked button
			e.target.classList.add("selected")
		}
	}
})

// Handle customer description button clicks (multiselect)
document.getElementById("customer-grid").addEventListener("click", function (e) {
	if (e.target.classList.contains("customer-btn")) {
		// Toggle selection - multiple can be selected
		e.target.classList.toggle("selected")
	}
})

// No need for menu item selection handlers anymore - using inline add buttons

// Send order to cook
sendOrderBtn.addEventListener("click", function () {
	const paid = document.querySelector('input[name="paid"]:checked').value === "true"
	const eatType = document.querySelector('input[name="eatType"]:checked').value

	// Get selected table number from button grid
	const selectedTableBtn = document.querySelector("#table-number-grid .number-btn.selected")
	const tableNumber = selectedTableBtn ? selectedTableBtn.dataset.table : null

	// Get selected sound indicator from button grid
	const selectedSoundBtn = document.querySelector("#sound-indicator-grid .number-btn.selected")
	const soundIndicator = selectedSoundBtn ? selectedSoundBtn.dataset.sound : null

	// Get selected customer descriptions from button grid (multiselect)
	const selectedCustomerBtns = document.querySelectorAll("#customer-grid .customer-btn.selected")
	const customerDescription =
		selectedCustomerBtns.length > 0
			? Array.from(selectedCustomerBtns)
					.map((btn) => btn.dataset.customer)
					.join(", ")
			: null

	// Calculate total price
	const totalPrice = currentOrderItems.reduce((sum, item) => sum + parseInt(item.price), 0)

	// Create pizzas list (for display text)
	const pizzasList = currentOrderItems.map((item) => item.name).join(", ")

	const newOrder = orderService.addOrder({
		pizzaType: pizzasList,
		items: currentOrderItems, // Store items with prices
		paid,
		eatType,
		price: totalPrice,
		tableNumber: tableNumber || null,
		soundIndicator: soundIndicator || null,
		customerDescription: customerDescription || null,
	})

	updateOrders()

	// Reset everything
	currentOrderItems = []
	updateCurrentOrderDisplay()
	Array.from(document.querySelectorAll('input[name="paid"]')).forEach((radio) => (radio.checked = false))
	Array.from(document.querySelectorAll('input[name="eatType"]')).forEach((radio) => (radio.checked = false))

	// Reset button selections
	document.querySelectorAll("#table-number-grid .number-btn").forEach((btn) => {
		btn.classList.remove("selected")
	})
	document.querySelectorAll("#sound-indicator-grid .number-btn").forEach((btn) => {
		btn.classList.remove("selected")
	})
	document.querySelectorAll("#customer-grid .customer-btn").forEach((btn) => {
		btn.classList.remove("selected")
	})

	checkSendOrderReady()

	// Switch to ongoing orders screen
	navTabs.forEach((t) => t.classList.remove("active"))
	const ongoingOrdersTab = document.querySelector('.nav-tab[data-screen="ongoing-orders"]')
	if (ongoingOrdersTab) {
		ongoingOrdersTab.classList.add("active")
	}
	screens.forEach((s) => s.classList.remove("active"))
	const ongoingOrdersScreen = document.querySelector('.screen[data-screen="ongoing-orders"]')
	if (ongoingOrdersScreen) {
		ongoingOrdersScreen.classList.add("active")
	}

	// Scroll to the newly created order after a short delay to allow rendering
	setTimeout(() => {
		const newOrderElement = ordersList.querySelector(`[data-order-id="${newOrder.id}"]`)
		if (newOrderElement) {
			newOrderElement.scrollIntoView({ behavior: "smooth", block: "center" })
		}
	}, 100)
})

document.getElementById("paid-status-grid").addEventListener("change", checkSendOrderReady)
document.getElementById("eat-type-grid").addEventListener("change", checkSendOrderReady)

document.getElementById("reset-order").addEventListener("click", function () {
	// Clear current order
	currentOrderItems = []
	updateCurrentOrderDisplay()

	// Clear payment status selection
	Array.from(document.querySelectorAll('input[name="paid"]')).forEach((radio) => (radio.checked = false))
	// Clear order type selection
	Array.from(document.querySelectorAll('input[name="eatType"]')).forEach((radio) => (radio.checked = false))

	// Clear button selections
	document.querySelectorAll("#table-number-grid .number-btn").forEach((btn) => {
		btn.classList.remove("selected")
	})
	document.querySelectorAll("#sound-indicator-grid .number-btn").forEach((btn) => {
		btn.classList.remove("selected")
	})
	document.querySelectorAll("#customer-grid .customer-btn").forEach((btn) => {
		btn.classList.remove("selected")
	})

	checkSendOrderReady()
})

// Helper function to animate order completion with 5s countdown before moving to history
// triggeredBy: 'serve' (clicked serve when already paid) or 'paid' (clicked paid when already served)
function completeOrderWithAnimation(orderId, triggeredBy) {
	const wrapper = ordersList.querySelector(`.order-item-wrapper[data-order-id="${orderId}"]`)
	if (wrapper) {
		const orderItem = wrapper.querySelector(".order-item")

		// Create countdown overlay
		const countdownOverlay = document.createElement("div")
		countdownOverlay.classList.add("countdown-overlay")
		countdownOverlay.innerHTML = `
			<div class="countdown-content">
				<div class="countdown-text">✅ Completed</div>
				<div class="countdown-number">5</div>
				<button type="button" class="countdown-cancel-btn">Cancel</button>
			</div>
		`
		orderItem.appendChild(countdownOverlay)

		// Start countdown
		let seconds = 5
		const countdownNumber = countdownOverlay.querySelector(".countdown-number")
		const cancelBtn = countdownOverlay.querySelector(".countdown-cancel-btn")

		const countdownInterval = setInterval(() => {
			seconds--
			countdownNumber.textContent = seconds

			if (seconds <= 0) {
				clearInterval(countdownInterval)
				wrapper.classList.add("completing")
				// Wait for fade animation to finish
				setTimeout(() => {
					updateOrders()
					updateHistory()
				}, 500)
			}
		}, 1000)

		// Handle cancel button click - restore order to previous state
		cancelBtn.addEventListener("click", (e) => {
			e.stopPropagation()
			clearInterval(countdownInterval)
			countdownOverlay.remove()
			// Restore to state before the action that triggered countdown
			if (triggeredBy === 'serve') {
				// Was paid, clicked serve -> revert serve (back to paid + not served)
				orderService.markAsUnserved(orderId)
			} else {
				// Was served, clicked paid -> revert paid (back to served + not paid)
				orderService.markAsUnpaid(orderId)
			}
			updateOrders()
		})
	} else {
		updateOrders()
		updateHistory()
	}
}

// Handle serve button clicks
ordersList.addEventListener("click", function (e) {
	if (e.target.classList.contains("serve-btn")) {
		const orderId = parseInt(e.target.dataset.orderId)
		const order = orderService.orders.find((o) => o.id === orderId)

		// Mark as served (stays in ongoing if not paid)
		orderService.markAsServed(orderId)

		// Only move to history if both served AND paid
		if (order && order.paid) {
			completeOrderWithAnimation(orderId, 'serve')
		} else {
			updateOrders()
		}
	}

	// Handle mark paid button clicks
	if (e.target.classList.contains("mark-paid-btn")) {
		const orderId = parseInt(e.target.dataset.orderId)
		const order = orderService.orders.find((o) => o.id === orderId)
		orderService.markAsPaid(orderId)

		// If already served, move to history now with animation
		if (order && order.served) {
			completeOrderWithAnimation(orderId, 'paid')
		} else {
			updateOrders()
		}
	}

	// Handle mark unpaid button clicks (toggle paid back to unpaid)
	if (e.target.classList.contains("mark-unpaid-btn")) {
		const orderId = parseInt(e.target.dataset.orderId)
		orderService.markAsUnpaid(orderId)
		updateOrders()
	}

	// Handle mark unserved button clicks (toggle served back to unserved)
	if (e.target.classList.contains("mark-unserved-btn")) {
		const orderId = parseInt(e.target.dataset.orderId)
		orderService.markAsUnserved(orderId)
		updateOrders()
	}
})

// Handle screen navigation
navTabs.forEach((tab) => {
	tab.addEventListener("click", function () {
		const targetScreen = tab.dataset.screen

		// Update active nav tab
		navTabs.forEach((t) => t.classList.remove("active"))
		tab.classList.add("active")

		// Update active screen
		screens.forEach((s) => s.classList.remove("active"))
		const screenToShow = document.querySelector(`.screen[data-screen="${targetScreen}"]`)
		if (screenToShow) {
			screenToShow.classList.add("active")
		}

		// Update the appropriate list when switching screens
		if (targetScreen === "ongoing-orders") {
			updateOrders()
		} else if (targetScreen === "orders-history") {
			updateHistory()
		}
	})
})

// Update timers every second
setInterval(updateTimers, 1000)

// Initial setup
checkSendOrderReady()

updateOrders()
updateHistory()

// ============================================
// Analytics Page Functionality
// ============================================

let currentAnalyticsPeriod = "daily"
let previousScreen = "take-order"

// Show analytics page
document.getElementById("analytics-btn").addEventListener("click", function () {
	// Store current screen to return to
	const activeTab = document.querySelector(".nav-tab.active")
	if (activeTab) {
		previousScreen = activeTab.dataset.screen
	}

	// Hide nav tabs and show analytics
	document.querySelector(".screen-nav").style.display = "none"
	navTabs.forEach((t) => t.classList.remove("active"))
	screens.forEach((s) => s.classList.remove("active"))

	const analyticsScreen = document.querySelector('.screen[data-screen="analytics"]')
	if (analyticsScreen) {
		analyticsScreen.classList.add("active")
	}

	// Update analytics data
	updateAnalytics()
})

// Back button from analytics
document.getElementById("analytics-back-btn").addEventListener("click", function () {
	// Show nav tabs again
	document.querySelector(".screen-nav").style.display = "flex"

	// Return to previous screen
	screens.forEach((s) => s.classList.remove("active"))
	const previousScreenEl = document.querySelector(`.screen[data-screen="${previousScreen}"]`)
	if (previousScreenEl) {
		previousScreenEl.classList.add("active")
	}

	// Restore nav tab
	navTabs.forEach((t) => {
		t.classList.remove("active")
		if (t.dataset.screen === previousScreen) {
			t.classList.add("active")
		}
	})
})

// Analytics period tabs
document.querySelectorAll(".analytics-tab").forEach((tab) => {
	tab.addEventListener("click", function () {
		document.querySelectorAll(".analytics-tab").forEach((t) => t.classList.remove("active"))
		tab.classList.add("active")
		currentAnalyticsPeriod = tab.dataset.period
		updateAnalytics()
	})
})

// Update analytics display
function updateAnalytics() {
	let stats, comparison, trendData, trendTitle

	if (currentAnalyticsPeriod === "daily") {
		stats = analytics.getDailyStats()
		comparison = analytics.getComparison(analytics.getTodayOrders(), analytics.getYesterdayOrders())
		trendData = Object.entries(analytics.getHourlyBreakdown())
			.filter(([hour]) => parseInt(hour) >= 8 && parseInt(hour) <= 22)
			.map(([hour, data]) => ({
				label: `${hour}:00`,
				value: data.orders,
			}))
		trendTitle = "Orders by Hour (Today)"
	} else if (currentAnalyticsPeriod === "weekly") {
		stats = analytics.getWeeklyStats()
		comparison = analytics.getComparison(analytics.getWeekOrders(), analytics.getLastWeekOrders())
		trendData = analytics.getWeeklyBreakdown().map((day) => ({
			label: day.date,
			value: day.orders,
		}))
		trendTitle = "Orders by Day (This Week)"
	} else {
		stats = analytics.getMonthlyStats()
		comparison = analytics.getComparison(analytics.getMonthOrders(), analytics.getLastMonthOrders())
		// For monthly, show weekly breakdown
		trendData = analytics.getWeeklyBreakdown().map((day) => ({
			label: day.date,
			value: day.orders,
		}))
		trendTitle = "Recent Orders Trend"
	}

	// Update summary cards
	document.getElementById("total-revenue").textContent = `${stats.totalRevenue.toLocaleString()} THB`
	document.getElementById("total-orders").textContent = stats.totalOrders
	document.getElementById("avg-order").textContent = `${stats.averageOrderValue} THB`
	document.getElementById("items-sold").textContent = stats.itemsSold

	// Update comparison indicators
	updateComparisonBadge("revenue-change", comparison.revenueChange)
	updateComparisonBadge("orders-change", comparison.ordersChange)
	updateComparisonBadge("avg-change", comparison.avgOrderChange)

	// Update Order Type pie chart
	const orderTypeData = [
		{ label: "Eat In", value: stats.ordersByType["eat-in"] || 0 },
		{ label: "Take Away", value: stats.ordersByType["take-away"] || 0 },
	]
	document.getElementById("order-type-chart").innerHTML = generatePieChart(orderTypeData, 120)
	document.getElementById("order-type-legend").innerHTML = generateLegend(orderTypeData)

	// Update Category pie chart
	const categoryData = Object.entries(stats.categoryBreakdown).map(([name, data]) => ({
		label: name,
		value: data.count,
	}))
	document.getElementById("category-chart").innerHTML = generatePieChart(categoryData, 120)
	document.getElementById("category-legend").innerHTML = generateLegend(categoryData)

	// Update top items list
	const topItemsList = document.getElementById("top-items-list")
	if (stats.topItemsSorted.length === 0) {
		topItemsList.innerHTML = '<div class="analytics-empty">No items sold yet</div>'
	} else {
		topItemsList.innerHTML = stats.topItemsSorted
			.map(
				([name, count], index) => `
			<div class="top-item">
				<div class="top-item-rank ${index < 3 ? "rank-" + (index + 1) : ""}">${index + 1}</div>
				<span class="top-item-name">${name}</span>
				<span class="top-item-count">${count} sold</span>
			</div>
		`
			)
			.join("")
	}

	// Update sales trend chart
	document.getElementById("trend-title").textContent = trendTitle
	document.getElementById("sales-trend-chart").innerHTML = generateBarChart(trendData, 400, 180)

	// Update peak hours
	const peakHours = analytics.getPeakHours()
	const peakHoursContainer = document.getElementById("peak-hours")

	if (peakHours.length === 0 || peakHours.every((h) => h.orders === 0)) {
		peakHoursContainer.innerHTML = '<div class="analytics-empty">No data for peak hours</div>'
	} else {
		const maxOrders = Math.max(...peakHours.map((h) => h.orders), 1)
		peakHoursContainer.innerHTML = peakHours
			.filter((h) => h.orders > 0)
			.map(
				(hour) => `
			<div class="peak-hour-item">
				<span class="peak-hour-time">${hour.hour}:00</span>
				<div class="peak-hour-bar">
					<div class="peak-hour-fill" style="width: ${(hour.orders / maxOrders) * 100}%"></div>
				</div>
				<span class="peak-hour-count">${hour.orders} orders</span>
			</div>
		`
			)
			.join("")
	}
}

function updateComparisonBadge(elementId, change) {
	const element = document.getElementById(elementId)
	if (change === 0) {
		element.textContent = ""
		element.className = "summary-change"
	} else if (change > 0) {
		element.textContent = `+${change}% vs prev`
		element.className = "summary-change positive"
	} else {
		element.textContent = `${change}% vs prev`
		element.className = "summary-change negative"
	}
}
