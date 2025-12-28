export function renderOrders(orders, container, orderService) {
	container.innerHTML = ""
	orders.forEach((order) => {
		const li = document.createElement("li")
		li.classList.add("order-item")

		const orderNo = document.createElement("div")
		orderNo.classList.add("order-no")
		orderNo.textContent = `#${order.orderNo}`

		const orderInfo = document.createElement("div")
		orderInfo.classList.add("order-info")

		const timer = document.createElement("span")
		timer.classList.add("order-timer")
		timer.textContent = orderService.getElapsedTime(order.timestamp)
		timer.dataset.orderId = order.id

		const details = document.createElement("span")
		details.classList.add("order-details")
		details.textContent = `${order.time} - ${order.pizzaType} (${order.price} THB) | ${order.paid ? "Paid" : "Unpaid"} | ${order.eatType}`

		orderInfo.appendChild(timer)
		orderInfo.appendChild(details)

		const serveBtn = document.createElement("button")
		serveBtn.classList.add("serve-btn")
		serveBtn.textContent = "Serve"
		serveBtn.dataset.orderId = order.id

		li.appendChild(orderNo)
		li.appendChild(orderInfo)
		li.appendChild(serveBtn)
		container.appendChild(li)
	})
}

export function renderHistoryOrders(orders, container) {
	container.innerHTML = ""
	if (orders.length === 0) {
		const emptyMsg = document.createElement("li")
		emptyMsg.classList.add("empty-message")
		emptyMsg.textContent = "No served orders yet"
		container.appendChild(emptyMsg)
		return
	}

	orders.forEach((order) => {
		const li = document.createElement("li")
		li.classList.add("order-item", "history-item")

		const orderNo = document.createElement("div")
		orderNo.classList.add("order-no", "order-no-history")
		orderNo.textContent = `#${order.orderNo}`

		const orderInfo = document.createElement("div")
		orderInfo.classList.add("order-info")

		const details = document.createElement("span")
		details.classList.add("order-details")
		details.textContent = `${order.time} - ${order.pizzaType} (${order.price} THB) | ${order.paid ? "Paid" : "Unpaid"} | ${order.eatType}`

		orderInfo.appendChild(details)

		const completedBadge = document.createElement("div")
		completedBadge.classList.add("completed-badge")
		completedBadge.textContent = "Completed"

		li.appendChild(orderNo)
		li.appendChild(orderInfo)
		li.appendChild(completedBadge)
		container.appendChild(li)
	})
}
