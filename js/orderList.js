export function renderOrders(orders, container, orderService) {
	container.innerHTML = ""
	orders.forEach((order) => {
		const li = document.createElement("li")
		li.classList.add("order-item")

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

		li.appendChild(orderInfo)
		li.appendChild(serveBtn)
		container.appendChild(li)
	})
}
