import { OrderService } from "./js/orderService.js"
import { renderOrders } from "./js/orderList.js"

const orderService = new OrderService()

const orderForm = document.getElementById("order-form")
const ordersList = document.getElementById("orders-list")
const navTabs = document.querySelectorAll(".nav-tab")
const screens = document.querySelectorAll(".screen")

function updateOrders() {
	const orders = orderService.getOrders()
	renderOrders(orders, ordersList, orderService)
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

orderForm.addEventListener("submit", function (e) {
	e.preventDefault()
	const pizzaType = orderForm.elements["pizzaType"].value
	const paid = orderForm.elements["paid"].value === "true"
	const eatType = orderForm.elements["eatType"].value
	const selectedPizza = orderForm.elements["pizzaType"]
	const price = selectedPizza.dataset.price
	orderService.addOrder({ pizzaType, paid, eatType, price })
	updateOrders()
	// Reset form selections after adding order
	Array.from(orderForm.elements["pizzaType"]).forEach((radio) => (radio.checked = false))
	Array.from(orderForm.elements["paid"]).forEach((radio) => (radio.checked = false))
	Array.from(orderForm.elements["eatType"]).forEach((radio) => (radio.checked = false))
	checkFormComplete()

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
})

const addOrderBtn = document.getElementById("add-order")

function checkFormComplete() {
	const pizzaTypeSelected = Array.from(orderForm.elements["pizzaType"]).some((radio) => radio.checked)
	const paidSelected = Array.from(orderForm.elements["paid"]).some((radio) => radio.checked)
	const eatTypeSelected = Array.from(orderForm.elements["eatType"]).some((radio) => radio.checked)
	addOrderBtn.disabled = !(pizzaTypeSelected && paidSelected && eatTypeSelected)
}

orderForm.addEventListener("change", checkFormComplete)

document.getElementById("reset-order").addEventListener("click", function () {
	// Clear pizza type selection
	Array.from(orderForm.elements["pizzaType"]).forEach((radio) => (radio.checked = false))
	// Clear payment status selection
	Array.from(orderForm.elements["paid"]).forEach((radio) => (radio.checked = false))
	// Clear order type selection
	Array.from(orderForm.elements["eatType"]).forEach((radio) => (radio.checked = false))
	checkFormComplete()
})

// Handle serve button clicks
ordersList.addEventListener("click", function (e) {
	if (e.target.classList.contains("serve-btn")) {
		const orderId = parseInt(e.target.dataset.orderId)
		orderService.markAsServed(orderId)
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

		// If switching to ongoing orders, update the list
		if (targetScreen === "ongoing-orders") {
			updateOrders()
		}
	})
})

// Update timers every second
setInterval(updateTimers, 1000)

// Initial check
checkFormComplete()

updateOrders()
