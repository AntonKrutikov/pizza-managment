import { OrderService } from "./js/orderService.js"
import { renderOrders, renderHistoryOrders } from "./js/orderList.js"

const orderService = new OrderService()

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
			showCustomPricePopup(item.name, card)
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
				addItemToOrder(`${item.name} (${variant.size})`, variant.price)
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
			addItemToOrder(item.name, item.price)
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
function addItemToOrder(displayName, price) {
	currentOrderItems.push({
		name: displayName,
		price: price,
	})

	updateCurrentOrderDisplay()
	checkSendOrderReady()
	updateFloatingButton()
}

// Custom price popup handling
let currentCustomItemName = null
let currentCustomCard = null

function showCustomPricePopup(itemName, card) {
	currentCustomItemName = itemName
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
		addItemToOrder(currentCustomItemName, price)
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
