// Helper function to get customer icon with text
function getCustomerIcon(description) {
	const iconMap = {
		'Man': '👨',
		'Woman': '👩',
		'Children': '👶',
		'Couple': '👫',
		'Family': '👨‍👩‍👧‍👦',
		'Group': '👥'
	}
	const icon = iconMap[description]
	return icon ? `${icon} ${description}` : description
}

export function renderOrders(orders, container, orderService) {
	container.innerHTML = ""
	orders.forEach((order) => {
		// Create wrapper for swipe functionality
		const wrapper = document.createElement("div")
		wrapper.classList.add("order-item-wrapper")
		wrapper.dataset.orderId = order.id

		const li = document.createElement("li")
		li.classList.add("order-item")
		li.dataset.orderId = order.id

		// Left section: Order number, timestamp, and timer
		const orderHeader = document.createElement("div")
		orderHeader.classList.add("order-header")

		const timestamp = document.createElement("div")
		timestamp.classList.add("order-timestamp")
		timestamp.textContent = order.time

		const orderNo = document.createElement("div")
		orderNo.classList.add("order-no")
		orderNo.textContent = `#${order.orderNo}`

		const timer = document.createElement("div")
		timer.classList.add("order-timer")
		timer.textContent = orderService.getElapsedTime(order.timestamp)
		timer.dataset.orderId = order.id

		orderHeader.appendChild(timestamp)
		orderHeader.appendChild(orderNo)
		orderHeader.appendChild(timer)

		// Middle section: Order details
		const orderInfo = document.createElement("div")
		orderInfo.classList.add("order-info")

		// Items list with prices
		const itemsList = document.createElement("div")
		itemsList.classList.add("order-items-list")

		// Use the items array if available (new format), otherwise fallback to pizzaType string
		if (order.items && Array.isArray(order.items)) {
			order.items.forEach(item => {
				const itemDiv = document.createElement("div")
				itemDiv.classList.add("order-item-entry")
				itemDiv.innerHTML = `<span class="item-name-text">${item.name} - ฿${item.price}</span>`
				itemsList.appendChild(itemDiv)
			})
		} else {
			// Fallback for old orders
			const items = order.pizzaType.split(", ")
			items.forEach(item => {
				const itemDiv = document.createElement("div")
				itemDiv.classList.add("order-item-entry")
				itemDiv.innerHTML = `<span class="item-name-text">${item}</span>`
				itemsList.appendChild(itemDiv)
			})
		}
		orderInfo.appendChild(itemsList)

		// Order type with white badge (icon inside badge)
		const orderType = document.createElement("div")
		orderType.classList.add("order-type")
		const typeIcon = order.eatType === "take-away" ? "📦" : "🍽️"
		const typeText = order.eatType === "take-away" ? "Take Away" : "Eat In"
		orderType.innerHTML = `<span class="type-badge">${typeIcon} ${typeText}</span>`
		orderInfo.appendChild(orderType)

		// Optional details
		if (order.tableNumber || order.soundIndicator || order.customerDescription) {
			const optionalDetails = document.createElement("div")
			optionalDetails.classList.add("optional-details")

			if (order.tableNumber) {
				const tableDiv = document.createElement("div")
				tableDiv.textContent = `Table: ${order.tableNumber}`
				optionalDetails.appendChild(tableDiv)
			}

			if (order.soundIndicator) {
				const soundDiv = document.createElement("div")
				soundDiv.textContent = `Sound: #${order.soundIndicator}`
				optionalDetails.appendChild(soundDiv)
			}

			if (order.customerDescription) {
				const customerDiv = document.createElement("div")
				// Convert customer descriptions to icons
				const customers = order.customerDescription.split(', ').map(c => getCustomerIcon(c)).join(' ')
				customerDiv.textContent = customers
				optionalDetails.appendChild(customerDiv)
			}

			orderInfo.appendChild(optionalDetails)
		}

		// Right section: Serve button and payment status
		const orderActions = document.createElement("div")
		orderActions.classList.add("order-actions")

		// Show total price
		const totalPrice = document.createElement("div")
		totalPrice.classList.add("order-total-price")
		totalPrice.textContent = `฿${order.price}`
		orderActions.appendChild(totalPrice)

		// Show "Not Paid" button (yellow) or "Paid" label
		if (!order.paid) {
			const markPaidBtn = document.createElement("button")
			markPaidBtn.classList.add("mark-paid-btn")
			markPaidBtn.textContent = "Not Paid"
			markPaidBtn.dataset.orderId = order.id
			orderActions.appendChild(markPaidBtn)
		} else {
			const paidLabel = document.createElement("div")
			paidLabel.classList.add("paid-label")
			paidLabel.textContent = "Paid ✓"
			orderActions.appendChild(paidLabel)
		}

		// Serve button - always visible and enabled (customer can pay after serve)
		const serveBtn = document.createElement("button")
		serveBtn.classList.add("serve-btn")
		serveBtn.textContent = "Serve"
		serveBtn.dataset.orderId = order.id
		orderActions.appendChild(serveBtn)

		li.appendChild(orderHeader)
		li.appendChild(orderInfo)
		li.appendChild(orderActions)

		// Create delete button (hidden by default, shown on swipe)
		const deleteBtn = document.createElement("button")
		deleteBtn.classList.add("delete-order-btn")
		deleteBtn.textContent = "Delete"
		deleteBtn.addEventListener("click", (e) => {
			e.stopPropagation()
			if (confirm(`Delete order #${order.orderNo}?`)) {
				orderService.removeOrder(order.id)
				wrapper.remove()
			}
		})

		// Add swipe functionality
		let startX = 0
		let currentX = 0
		let isSwiping = false

		const resetSwipe = () => {
			li.style.transition = 'transform 0.3s ease'
			li.style.transform = 'translateX(0)'
			wrapper.classList.remove('swiped')
		}

		const onTouchStart = (e) => {
			startX = e.touches[0].clientX
			currentX = startX
			isSwiping = true
			li.style.transition = 'none'
		}

		const onTouchMove = (e) => {
			if (!isSwiping) return
			currentX = e.touches[0].clientX
			const diff = currentX - startX

			// Allow left swipe (negative) or right swipe to reset (positive when swiped)
			if (diff < 0) {
				li.style.transform = `translateX(${Math.max(diff, -100)}px)`
			} else if (wrapper.classList.contains('swiped') && diff > 0) {
				li.style.transform = `translateX(${Math.min(-100 + diff, 0)}px)`
			}
		}

		const onTouchEnd = () => {
			if (!isSwiping) return
			isSwiping = false
			li.style.transition = 'transform 0.3s ease'

			const diff = currentX - startX

			// If swiped left more than 50px, show delete button
			if (diff < -50) {
				li.style.transform = 'translateX(-100px)'
				wrapper.classList.add('swiped')
			} else {
				// Reset position
				li.style.transform = 'translateX(0)'
				wrapper.classList.remove('swiped')
			}
		}

		// Mouse events for desktop testing
		let isMouseDown = false
		const onMouseDown = (e) => {
			// Don't start swipe on button clicks
			if (e.target.tagName === 'BUTTON') return
			startX = e.clientX
			currentX = startX
			isMouseDown = true
			li.style.transition = 'none'
		}

		const onMouseMove = (e) => {
			if (!isMouseDown) return
			currentX = e.clientX
			const diff = currentX - startX

			// Allow left swipe (negative) or right swipe to reset (positive when swiped)
			if (diff < 0) {
				li.style.transform = `translateX(${Math.max(diff, -100)}px)`
			} else if (wrapper.classList.contains('swiped') && diff > 0) {
				li.style.transform = `translateX(${Math.min(-100 + diff, 0)}px)`
			}
		}

		const onMouseUp = () => {
			if (!isMouseDown) return
			isMouseDown = false
			li.style.transition = 'transform 0.3s ease'

			const diff = currentX - startX

			// If swiped left more than 50px, show delete button
			if (diff < -50) {
				li.style.transform = 'translateX(-100px)'
				wrapper.classList.add('swiped')
			} else {
				// Reset position
				li.style.transform = 'translateX(0)'
				wrapper.classList.remove('swiped')
			}
		}

		li.addEventListener('touchstart', onTouchStart, { passive: true })
		li.addEventListener('touchmove', onTouchMove, { passive: true })
		li.addEventListener('touchend', onTouchEnd)
		li.addEventListener('mousedown', onMouseDown)
		li.addEventListener('mousemove', onMouseMove)
		li.addEventListener('mouseup', onMouseUp)
		li.addEventListener('mouseleave', onMouseUp)

		wrapper.appendChild(li)
		wrapper.appendChild(deleteBtn)
		container.appendChild(wrapper)
	})
}

export function renderHistoryOrders(orders, container, orderService) {
	container.innerHTML = ""
	if (orders.length === 0) {
		const emptyMsg = document.createElement("li")
		emptyMsg.classList.add("empty-message")
		emptyMsg.textContent = "No served orders yet"
		container.appendChild(emptyMsg)
		return
	}

	// Group orders by date
	const ordersByDate = {}
	orders.forEach((order) => {
		const date = new Date(order.timestamp)
		const dateKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

		if (!ordersByDate[dateKey]) {
			ordersByDate[dateKey] = {
				orders: [],
				total: 0,
				timestamp: order.timestamp
			}
		}

		ordersByDate[dateKey].orders.push(order)
		ordersByDate[dateKey].total += parseInt(order.price)
	})

	// Sort dates (most recent first)
	const sortedDates = Object.keys(ordersByDate).sort((a, b) => {
		return ordersByDate[b].timestamp - ordersByDate[a].timestamp
	})

	// Render each date section
	sortedDates.forEach((dateKey) => {
		const dateData = ordersByDate[dateKey]

		// Create date header with total income
		const dateHeader = document.createElement("div")
		dateHeader.classList.add("history-date-header")

		const dateTitle = document.createElement("h3")
		dateTitle.classList.add("history-date-title")

		// Check if it's today
		const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
		const displayDate = dateKey === today ? `Today (${dateKey})` : dateKey
		dateTitle.textContent = displayDate

		const dateTotalBadge = document.createElement("div")
		dateTotalBadge.classList.add("history-date-total")
		dateTotalBadge.textContent = `Total: ฿${dateData.total}`

		dateHeader.appendChild(dateTitle)
		dateHeader.appendChild(dateTotalBadge)
		container.appendChild(dateHeader)

		// Create orders list for this date
		const dateOrdersList = document.createElement("ul")
		dateOrdersList.classList.add("history-date-orders")

		dateData.orders.forEach((order) => {
			// Create wrapper for swipe functionality
			const wrapper = document.createElement("div")
			wrapper.classList.add("order-item-wrapper")
			wrapper.dataset.orderId = order.id

			const li = document.createElement("li")
			li.classList.add("order-item", "history-item")
			li.dataset.orderId = order.id

			const orderNo = document.createElement("div")
			orderNo.classList.add("order-no", "order-no-history")
			orderNo.textContent = `#${order.orderNo}`

			const orderInfo = document.createElement("div")
			orderInfo.classList.add("order-info")

			const details = document.createElement("span")
			details.classList.add("order-details")

			// Remove "Paid" status from display
			let detailsText = `${order.time} - ${order.pizzaType} (฿${order.price})`

			const typeIcon = order.eatType === "take-away" ? "📦" : "🍽️"
			const typeText = order.eatType === "take-away" ? "Take Away" : "Eat In"
			detailsText += ` | ${typeIcon} ${typeText}`

			// Add table number if provided
			if (order.tableNumber) {
				detailsText += ` | Table ${order.tableNumber}`
			}

			// Add sound indicator if provided
			if (order.soundIndicator) {
				detailsText += ` | Sound #${order.soundIndicator}`
			}

			// Add customer description if provided
			if (order.customerDescription) {
				const customers = order.customerDescription.split(', ').map(c => getCustomerIcon(c)).join(' ')
				detailsText += ` | ${customers}`
			}

			details.textContent = detailsText

			orderInfo.appendChild(details)

			const completedBadge = document.createElement("div")
			completedBadge.classList.add("completed-badge")
			completedBadge.textContent = "Completed"

			li.appendChild(orderNo)
			li.appendChild(orderInfo)
			li.appendChild(completedBadge)

			// Create delete button (hidden by default, shown on swipe)
			const deleteBtn = document.createElement("button")
			deleteBtn.classList.add("delete-order-btn")
			deleteBtn.textContent = "Delete"

			deleteBtn.addEventListener("click", (e) => {
				e.stopPropagation()
				if (confirm(`Delete order #${order.orderNo} from history?`)) {
					orderService.removeOrder(order.id)
					wrapper.remove()
				}
			})

			// Add swipe functionality
			let startX = 0
			let currentX = 0
			let isSwiping = false

			const onTouchStart = (e) => {
				startX = e.touches[0].clientX
				currentX = startX
				isSwiping = true
				li.style.transition = 'none'
			}

			const onTouchMove = (e) => {
				if (!isSwiping) return
				currentX = e.touches[0].clientX
				const diff = currentX - startX

				// Allow left swipe (negative) or right swipe to reset (positive when swiped)
				if (diff < 0) {
					li.style.transform = `translateX(${Math.max(diff, -100)}px)`
				} else if (wrapper.classList.contains('swiped') && diff > 0) {
					li.style.transform = `translateX(${Math.min(-100 + diff, 0)}px)`
				}
			}

			const onTouchEnd = () => {
				if (!isSwiping) return
				isSwiping = false
				li.style.transition = 'transform 0.3s ease'

				const diff = currentX - startX

				// If swiped left more than 50px, show delete button
				if (diff < -50) {
					li.style.transform = 'translateX(-100px)'
					wrapper.classList.add('swiped')
				} else {
					// Reset position
					li.style.transform = 'translateX(0)'
					wrapper.classList.remove('swiped')
				}
			}

			// Mouse events for desktop testing
			let isMouseDown = false
			const onMouseDown = (e) => {
				// Don't start swipe on button clicks
				if (e.target.tagName === 'BUTTON') return
				startX = e.clientX
				currentX = startX
				isMouseDown = true
				li.style.transition = 'none'
			}

			const onMouseMove = (e) => {
				if (!isMouseDown) return
				currentX = e.clientX
				const diff = currentX - startX

				// Allow left swipe (negative) or right swipe to reset (positive when swiped)
				if (diff < 0) {
					li.style.transform = `translateX(${Math.max(diff, -100)}px)`
				} else if (wrapper.classList.contains('swiped') && diff > 0) {
					li.style.transform = `translateX(${Math.min(-100 + diff, 0)}px)`
				}
			}

			const onMouseUp = () => {
				if (!isMouseDown) return
				isMouseDown = false
				li.style.transition = 'transform 0.3s ease'

				const diff = currentX - startX

				// If swiped left more than 50px, show delete button
				if (diff < -50) {
					li.style.transform = 'translateX(-100px)'
					wrapper.classList.add('swiped')
				} else {
					// Reset position
					li.style.transform = 'translateX(0)'
					wrapper.classList.remove('swiped')
				}
			}

			li.addEventListener('touchstart', onTouchStart, { passive: true })
			li.addEventListener('touchmove', onTouchMove, { passive: true })
			li.addEventListener('touchend', onTouchEnd)
			li.addEventListener('mousedown', onMouseDown)
			li.addEventListener('mousemove', onMouseMove)
			li.addEventListener('mouseup', onMouseUp)
			li.addEventListener('mouseleave', onMouseUp)

			wrapper.appendChild(li)
			wrapper.appendChild(deleteBtn)
			dateOrdersList.appendChild(wrapper)
		})

		container.appendChild(dateOrdersList)
	})
}
