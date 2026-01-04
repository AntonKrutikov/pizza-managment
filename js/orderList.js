// Helper function to get customer icon with text
function getCustomerIcon(description) {
	const iconMap = {
		Man: "👨",
		Woman: "👩",
		Children: "👶",
		Couple: "👫",
		Family: "👨‍👩‍👧‍👦",
		Group: "👥",
	}
	const icon = iconMap[description]
	return icon ? `${icon} ${description}` : description
}

// Popup helper functions
let currentPopupCallback = null
let currentPopupOrderId = null
let numberSelectorSelectedValue = null
let eatTypeSelectorSelectedValue = null
let itemActionCallback = null
let paymentTypeSelectorSelectedValue = null

export function showNumberSelectorPopup(title, currentValue, orderId, callback) {
	const popup = document.getElementById("number-selector-popup")
	const titleEl = document.getElementById("number-selector-title")
	const grid = document.getElementById("number-selector-grid")
	const confirmBtn = document.getElementById("number-selector-confirm")

	titleEl.textContent = title
	currentPopupCallback = callback
	currentPopupOrderId = orderId
	numberSelectorSelectedValue = currentValue

	// Update selected state
	grid.querySelectorAll(".number-selector-btn").forEach((btn) => {
		btn.classList.toggle("selected", btn.dataset.value === currentValue)
	})

	// Disable confirm if no selection
	confirmBtn.disabled = !currentValue

	popup.style.display = "flex"
}

export function hideNumberSelectorPopup() {
	const popup = document.getElementById("number-selector-popup")
	popup.style.display = "none"
	currentPopupCallback = null
	currentPopupOrderId = null
	numberSelectorSelectedValue = null
}

export function showEatTypeSelectorPopup(currentValue, orderId, callback) {
	const popup = document.getElementById("eat-type-selector-popup")
	const confirmBtn = document.getElementById("eat-type-selector-confirm")
	currentPopupCallback = callback
	currentPopupOrderId = orderId
	eatTypeSelectorSelectedValue = currentValue

	// Update selected state
	popup.querySelectorAll(".eat-type-selector-btn").forEach((btn) => {
		btn.classList.toggle("selected", btn.dataset.value === currentValue)
	})

	// Disable confirm initially (need to select a different value)
	confirmBtn.disabled = true

	popup.style.display = "flex"
}

export function hideEatTypeSelectorPopup() {
	const popup = document.getElementById("eat-type-selector-popup")
	popup.style.display = "none"
	currentPopupCallback = null
	currentPopupOrderId = null
	eatTypeSelectorSelectedValue = null
}

export function showItemActionPopup(title, message, callback) {
	const popup = document.getElementById("item-action-popup")
	const titleEl = document.getElementById("item-action-title")
	const messageEl = document.getElementById("item-action-message")

	titleEl.textContent = title
	messageEl.textContent = message
	itemActionCallback = callback

	popup.style.display = "flex"
}

export function hideItemActionPopup() {
	const popup = document.getElementById("item-action-popup")
	popup.style.display = "none"
	itemActionCallback = null
}

export function showPaymentTypePopup(orderId, callback) {
	const popup = document.getElementById("payment-type-popup")
	const confirmBtn = document.getElementById("payment-type-confirm")
	currentPopupCallback = callback
	currentPopupOrderId = orderId
	paymentTypeSelectorSelectedValue = null

	// Reset selection
	popup.querySelectorAll(".payment-type-selector-btn").forEach((btn) => {
		btn.classList.remove("selected")
	})

	// Disable confirm initially
	confirmBtn.disabled = true

	popup.style.display = "flex"
}

export function hidePaymentTypePopup() {
	const popup = document.getElementById("payment-type-popup")
	popup.style.display = "none"
	currentPopupCallback = null
	currentPopupOrderId = null
	paymentTypeSelectorSelectedValue = null
}

// Initialize popup event listeners (call once on page load)
export function initOrderPopups(orderService, updateCallback) {
	// Number selector popup - selection
	const numberGrid = document.getElementById("number-selector-grid")
	numberGrid.addEventListener("click", (e) => {
		if (e.target.classList.contains("number-selector-btn")) {
			const value = e.target.dataset.value
			numberSelectorSelectedValue = value

			// Update visual selection
			numberGrid.querySelectorAll(".number-selector-btn").forEach((btn) => {
				btn.classList.toggle("selected", btn.dataset.value === value)
			})

			// Enable confirm button
			document.getElementById("number-selector-confirm").disabled = false
		}
	})

	// Number selector confirm
	document.getElementById("number-selector-confirm").addEventListener("click", () => {
		if (currentPopupCallback && currentPopupOrderId && numberSelectorSelectedValue) {
			currentPopupCallback(currentPopupOrderId, numberSelectorSelectedValue)
			hideNumberSelectorPopup()
			updateCallback()
		}
	})

	document.getElementById("number-selector-cancel").addEventListener("click", hideNumberSelectorPopup)
	document.getElementById("number-selector-clear").addEventListener("click", () => {
		if (currentPopupCallback && currentPopupOrderId) {
			currentPopupCallback(currentPopupOrderId, null)
			hideNumberSelectorPopup()
			updateCallback()
		}
	})

	// Close on overlay click
	document.getElementById("number-selector-popup").addEventListener("click", (e) => {
		if (e.target.id === "number-selector-popup") {
			hideNumberSelectorPopup()
		}
	})

	// Eat type selector popup - selection only
	const eatTypePopup = document.getElementById("eat-type-selector-popup")
	eatTypePopup.querySelectorAll(".eat-type-selector-btn").forEach((btn) => {
		btn.addEventListener("click", () => {
			const value = btn.dataset.value
			eatTypeSelectorSelectedValue = value

			// Update visual selection
			eatTypePopup.querySelectorAll(".eat-type-selector-btn").forEach((b) => {
				b.classList.toggle("selected", b.dataset.value === value)
			})

			// Enable confirm button
			document.getElementById("eat-type-selector-confirm").disabled = false
		})
	})

	// Eat type selector confirm
	document.getElementById("eat-type-selector-confirm").addEventListener("click", () => {
		if (currentPopupCallback && currentPopupOrderId && eatTypeSelectorSelectedValue) {
			currentPopupCallback(currentPopupOrderId, eatTypeSelectorSelectedValue)
			hideEatTypeSelectorPopup()
			updateCallback()
		}
	})

	document.getElementById("eat-type-selector-cancel").addEventListener("click", hideEatTypeSelectorPopup)

	// Close on overlay click
	eatTypePopup.addEventListener("click", (e) => {
		if (e.target.id === "eat-type-selector-popup") {
			hideEatTypeSelectorPopup()
		}
	})

	// Item action popup
	document.getElementById("item-action-confirm").addEventListener("click", () => {
		if (itemActionCallback) {
			itemActionCallback()
			hideItemActionPopup()
			updateCallback()
		}
	})

	document.getElementById("item-action-cancel").addEventListener("click", hideItemActionPopup)

	// Close on overlay click
	document.getElementById("item-action-popup").addEventListener("click", (e) => {
		if (e.target.id === "item-action-popup") {
			hideItemActionPopup()
		}
	})

	// Payment type selector popup
	const paymentTypePopup = document.getElementById("payment-type-popup")
	paymentTypePopup.querySelectorAll(".payment-type-selector-btn").forEach((btn) => {
		btn.addEventListener("click", () => {
			const value = btn.dataset.value
			paymentTypeSelectorSelectedValue = value

			// Update visual selection
			paymentTypePopup.querySelectorAll(".payment-type-selector-btn").forEach((b) => {
				b.classList.toggle("selected", b.dataset.value === value)
			})

			// Enable confirm button
			document.getElementById("payment-type-confirm").disabled = false
		})
	})

	// Payment type selector confirm
	document.getElementById("payment-type-confirm").addEventListener("click", () => {
		if (currentPopupCallback && currentPopupOrderId && paymentTypeSelectorSelectedValue) {
			// Callback handles its own update logic (including countdown animation)
			currentPopupCallback(currentPopupOrderId, paymentTypeSelectorSelectedValue)
			hidePaymentTypePopup()
			// Don't call updateCallback() here - the callback in main.js handles it
		}
	})

	document.getElementById("payment-type-cancel").addEventListener("click", hidePaymentTypePopup)

	// Close on overlay click
	paymentTypePopup.addEventListener("click", (e) => {
		if (e.target.id === "payment-type-popup") {
			hidePaymentTypePopup()
		}
	})
}

export function renderOrders(orders, container, orderService, onOrderChange = null) {
	container.innerHTML = ""
	orders.forEach((order) => {
		// Create wrapper for swipe functionality
		const wrapper = document.createElement("div")
		wrapper.classList.add("order-item-wrapper")
		wrapper.dataset.orderId = order.id

		const li = document.createElement("li")
		li.classList.add("order-item")
		// Add class for served but unpaid orders (50% opacity)
		if (order.served && !order.paid) {
			li.classList.add("served-awaiting-payment")
		}
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

		// Add Items button
		const addItemsBtn = document.createElement("button")
		addItemsBtn.type = "button"
		addItemsBtn.classList.add("add-items-btn")
		addItemsBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M12 5v14M5 12h14"/>
		</svg> Add`
		addItemsBtn.title = "Add items to this order"
		addItemsBtn.dataset.orderId = order.id
		addItemsBtn.dataset.orderNo = order.orderNo

		orderHeader.appendChild(timestamp)
		orderHeader.appendChild(orderNo)
		orderHeader.appendChild(timer)
		orderHeader.appendChild(addItemsBtn)

		// Middle section: Order details
		const orderInfo = document.createElement("div")
		orderInfo.classList.add("order-info")

		// Items list with images in a row
		const itemsList = document.createElement("div")
		itemsList.classList.add("order-items-list")

		// Use the items array if available (new format), otherwise fallback to pizzaType string
		if (order.items && Array.isArray(order.items)) {
			// Create images row container
			const imagesRow = document.createElement("div")
			imagesRow.classList.add("order-items-images-row")

			order.items.forEach((item, itemIndex) => {
				// Add image if available (handle both simple and composite images)
				if (item.image) {
					const imageWrapper = document.createElement("div")
					imageWrapper.classList.add("order-item-image-wrapper")
					if (item.served) {
						imageWrapper.classList.add("item-served")
					}
					imageWrapper.title = `Click to mark as ${item.served ? "not served" : "served"}`

					// Click to toggle served status
					imageWrapper.addEventListener("click", (e) => {
						e.stopPropagation()
						const action = item.served ? "not served" : "served"
						const title = item.served ? "Mark as Not Served" : "Mark as Served"
						showItemActionPopup(title, `Mark "${item.name}" as ${action}?`, () => {
							if (item.served) {
								orderService.markItemAsUnserved(order.id, itemIndex)
							} else {
								orderService.markItemAsServed(order.id, itemIndex)
							}
						})
					})

					if (typeof item.image === "object" && item.image.baseImage && item.image.iconImage) {
						// Side by side: quesadilla on left, type icon on right
						const imageContainer = document.createElement("div")
						imageContainer.classList.add("order-item-image-sidebyside")

						const leftImg = document.createElement("img")
						leftImg.src = item.image.baseImage
						leftImg.alt = "Quesadilla"
						leftImg.classList.add("order-item-image-left")

						const rightImg = document.createElement("img")
						rightImg.src = item.image.iconImage
						rightImg.alt = item.name
						rightImg.classList.add("order-item-image-right")
						const typeName = item.name.split(" (")[0].toLowerCase().replace(/\s+/g, "-")
						rightImg.classList.add(`type-${typeName}`)

						imageContainer.appendChild(leftImg)
						imageContainer.appendChild(rightImg)
						imageWrapper.appendChild(imageContainer)
					} else {
						// Simple image (string path)
						const img = document.createElement("img")
						img.src = item.image
						img.alt = item.name
						img.classList.add("order-item-image")
						imageWrapper.appendChild(img)
					}

					imagesRow.appendChild(imageWrapper)
				}

				// Item name span (clickable to mark as served)
				const nameSpan = document.createElement("span")
				nameSpan.classList.add("item-name-text")
				if (item.served) {
					nameSpan.classList.add("item-served")
				}
				nameSpan.textContent = item.name
				nameSpan.title = `Click to mark as ${item.served ? "not served" : "served"}`
				nameSpan.addEventListener("click", (e) => {
					e.stopPropagation()
					const action = item.served ? "not served" : "served"
					const title = item.served ? "Mark as Not Served" : "Mark as Served"
					showItemActionPopup(title, `Mark "${item.name}" as ${action}?`, () => {
						if (item.served) {
							orderService.markItemAsUnserved(order.id, itemIndex)
						} else {
							orderService.markItemAsServed(order.id, itemIndex)
						}
					})
				})
				itemsList.appendChild(nameSpan)

				// Item price span
				const priceSpan = document.createElement("span")
				priceSpan.classList.add("item-price-text")
				if (item.served) {
					priceSpan.classList.add("item-served")
				}
				priceSpan.textContent = `฿${item.price}`
				itemsList.appendChild(priceSpan)

				// Remove button (disabled if item is served)
				if (order.items.length > 1) {
					// Only show remove if more than 1 item
					const removeBtn = document.createElement("button")
					removeBtn.type = "button"
					removeBtn.classList.add("item-remove-btn")
					removeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
					</svg>`
					removeBtn.title = item.served ? "Cannot remove served item" : "Remove item"
					removeBtn.disabled = item.served
					removeBtn.addEventListener("click", (e) => {
						e.stopPropagation()
						showItemActionPopup("Remove Item", `Remove "${item.name}" from order #${order.orderNo}?`, () => {
							orderService.removeItemFromOrder(order.id, itemIndex)
						})
					})
					itemsList.appendChild(removeBtn)
				} else {
					// Empty placeholder to maintain grid alignment
					const placeholder = document.createElement("span")
					itemsList.appendChild(placeholder)
				}
			})

			// Add images row before items list if there are any images
			if (imagesRow.children.length > 0) {
				orderInfo.appendChild(imagesRow)
			}
		} else {
			// Fallback for old orders
			const items = order.pizzaType.split(", ")
			items.forEach((item) => {
				const itemDiv = document.createElement("div")
				itemDiv.classList.add("order-item-entry")
				itemDiv.innerHTML = `<span class="item-name-text">${item}</span>`
				itemsList.appendChild(itemDiv)
			})
		}
		orderInfo.appendChild(itemsList)

		// Order type with white badge (icon inside badge) - clickable to change
		const orderType = document.createElement("div")
		orderType.classList.add("order-type")
		const typeIcon = order.eatType === "take-away" ? "📦" : "🍽️"
		const typeText = order.eatType === "take-away" ? "Take Away" : "Eat In"
		const typeBadge = document.createElement("span")
		typeBadge.classList.add("type-badge", "type-badge-clickable")
		typeBadge.innerHTML = `${typeIcon} ${typeText}`
		typeBadge.title = "Click to change order type"
		typeBadge.addEventListener("click", (e) => {
			e.stopPropagation()
			showEatTypeSelectorPopup(order.eatType, order.id, (orderId, newType) => {
				orderService.updateEatType(orderId, newType)
			})
		})
		orderType.appendChild(typeBadge)
		orderInfo.appendChild(orderType)

		// Status icons (cooking if not served, money if not paid) - will be added to li later
		const statusIcons = document.createElement("div")
		statusIcons.classList.add("status-icons")
		if (!order.served) {
			const cookingIcon = document.createElement("span")
			cookingIcon.classList.add("status-icon", "cooking-icon")
			cookingIcon.textContent = "🍳"
			cookingIcon.title = "Cooking"
			statusIcons.appendChild(cookingIcon)
		}
		if (!order.paid) {
			const moneyIcon = document.createElement("span")
			moneyIcon.classList.add("status-icon", "money-icon")
			moneyIcon.textContent = "💰"
			moneyIcon.title = "Awaiting payment"
			statusIcons.appendChild(moneyIcon)
		}

		// Optional details - always show table and sound options (clickable)
		const optionalDetails = document.createElement("div")
		optionalDetails.classList.add("optional-details")

		// Table number - clickable
		const tableDiv = document.createElement("div")
		tableDiv.classList.add("optional-detail-clickable")
		tableDiv.innerHTML = order.tableNumber ? `Table: ${order.tableNumber} 🪑` : `+ Table 🪑`
		tableDiv.title = "Click to set table number"
		tableDiv.addEventListener("click", (e) => {
			e.stopPropagation()
			showNumberSelectorPopup("Select Table Number", order.tableNumber, order.id, (orderId, value) => {
				orderService.updateTableNumber(orderId, value)
			})
		})
		optionalDetails.appendChild(tableDiv)

		// Sound indicator - clickable
		const soundDiv = document.createElement("div")
		soundDiv.classList.add("optional-detail-clickable")
		soundDiv.innerHTML = order.soundIndicator ? `Sound: #${order.soundIndicator} 🔔` : `+ Sound 🔔`
		soundDiv.title = "Click to set sound indicator"
		soundDiv.addEventListener("click", (e) => {
			e.stopPropagation()
			showNumberSelectorPopup("Select Sound Indicator", order.soundIndicator, order.id, (orderId, value) => {
				orderService.updateSoundIndicator(orderId, value)
			})
		})
		optionalDetails.appendChild(soundDiv)

		// Customer description (not editable for now)
		if (order.customerDescription) {
			const customerDiv = document.createElement("div")
			const customers = order.customerDescription
				.split(", ")
				.map((c) => getCustomerIcon(c))
				.join(" ")
			customerDiv.textContent = customers
			optionalDetails.appendChild(customerDiv)
		}

		orderInfo.appendChild(optionalDetails)

		// Right section: Status icons + Buttons
		const orderActions = document.createElement("div")
		orderActions.classList.add("order-actions")

		// Add status icons on left side (if any)
		if (statusIcons.children.length > 0) {
			orderActions.appendChild(statusIcons)
		}

		// Buttons container on right side
		const buttonsContainer = document.createElement("div")
		buttonsContainer.classList.add("buttons-container")

		// Show total price
		const totalPrice = document.createElement("div")
		totalPrice.classList.add("order-total-price")
		totalPrice.textContent = `฿${order.price}`
		buttonsContainer.appendChild(totalPrice)

		// Show "Not Paid" button (yellow) or "Paid" button (clickable to toggle back)
		if (!order.paid) {
			const markPaidBtn = document.createElement("button")
			markPaidBtn.classList.add("mark-paid-btn")
			markPaidBtn.textContent = "Not Paid"
			markPaidBtn.dataset.orderId = order.id
			buttonsContainer.appendChild(markPaidBtn)
		} else {
			const markUnpaidBtn = document.createElement("button")
			markUnpaidBtn.classList.add("mark-unpaid-btn")
			markUnpaidBtn.textContent = "Paid ✓"
			markUnpaidBtn.dataset.orderId = order.id
			buttonsContainer.appendChild(markUnpaidBtn)
		}

		// Serve button - show "Served ✓" (clickable to toggle back) if already served, otherwise "Serve"
		if (order.served) {
			const markUnservedBtn = document.createElement("button")
			markUnservedBtn.classList.add("mark-unserved-btn")
			markUnservedBtn.textContent = "Served ✓"
			markUnservedBtn.dataset.orderId = order.id
			buttonsContainer.appendChild(markUnservedBtn)
		} else {
			const serveBtn = document.createElement("button")
			serveBtn.classList.add("serve-btn")
			serveBtn.textContent = "Serve"
			serveBtn.dataset.orderId = order.id
			buttonsContainer.appendChild(serveBtn)
		}

		orderActions.appendChild(buttonsContainer)

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
				if (onOrderChange) onOrderChange()
			}
		})

		// Add swipe functionality
		let startX = 0
		let currentX = 0
		let isSwiping = false

		const resetSwipe = () => {
			li.style.transition = "transform 0.3s ease"
			li.style.transform = "translateX(0)"
			wrapper.classList.remove("swiped")
		}

		const onTouchStart = (e) => {
			startX = e.touches[0].clientX
			currentX = startX
			isSwiping = true
			li.style.transition = "none"
		}

		const onTouchMove = (e) => {
			if (!isSwiping) return
			currentX = e.touches[0].clientX
			const diff = currentX - startX

			// Allow left swipe (negative) or right swipe to reset (positive when swiped)
			if (diff < 0) {
				li.style.transform = `translateX(${Math.max(diff, -100)}px)`
			} else if (wrapper.classList.contains("swiped") && diff > 0) {
				li.style.transform = `translateX(${Math.min(-100 + diff, 0)}px)`
			}
		}

		const onTouchEnd = () => {
			if (!isSwiping) return
			isSwiping = false
			li.style.transition = "transform 0.3s ease"

			const diff = currentX - startX

			// If swiped left more than 50px, show delete button
			if (diff < -50) {
				li.style.transform = "translateX(-100px)"
				wrapper.classList.add("swiped")
			} else {
				// Reset position
				li.style.transform = "translateX(0)"
				wrapper.classList.remove("swiped")
			}
		}

		// Mouse events for desktop testing
		let isMouseDown = false
		const onMouseDown = (e) => {
			// Don't start swipe on button clicks
			if (e.target.tagName === "BUTTON") return
			startX = e.clientX
			currentX = startX
			isMouseDown = true
			li.style.transition = "none"
		}

		const onMouseMove = (e) => {
			if (!isMouseDown) return
			currentX = e.clientX
			const diff = currentX - startX

			// Allow left swipe (negative) or right swipe to reset (positive when swiped)
			if (diff < 0) {
				li.style.transform = `translateX(${Math.max(diff, -100)}px)`
			} else if (wrapper.classList.contains("swiped") && diff > 0) {
				li.style.transform = `translateX(${Math.min(-100 + diff, 0)}px)`
			}
		}

		const onMouseUp = () => {
			if (!isMouseDown) return
			isMouseDown = false
			li.style.transition = "transform 0.3s ease"

			const diff = currentX - startX

			// If swiped left more than 50px, show delete button
			if (diff < -50) {
				li.style.transform = "translateX(-100px)"
				wrapper.classList.add("swiped")
			} else {
				// Reset position
				li.style.transform = "translateX(0)"
				wrapper.classList.remove("swiped")
			}
		}

		li.addEventListener("touchstart", onTouchStart, { passive: true })
		li.addEventListener("touchmove", onTouchMove, { passive: true })
		li.addEventListener("touchend", onTouchEnd)
		li.addEventListener("mousedown", onMouseDown)
		li.addEventListener("mousemove", onMouseMove)
		li.addEventListener("mouseup", onMouseUp)
		li.addEventListener("mouseleave", onMouseUp)

		wrapper.appendChild(li)
		wrapper.appendChild(deleteBtn)
		container.appendChild(wrapper)
	})
}

export function renderHistoryOrders(orders, container, orderService, onOrderChange = null) {
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
		const dateKey = date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

		if (!ordersByDate[dateKey]) {
			ordersByDate[dateKey] = {
				orders: [],
				total: 0,
				timestamp: order.timestamp,
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
		const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
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
				detailsText += ` | Table ${order.tableNumber} 🪑`
			}

			// Add sound indicator if provided
			if (order.soundIndicator) {
				detailsText += ` | Sound #${order.soundIndicator} 🔔`
			}

			// Add customer description if provided
			if (order.customerDescription) {
				const customers = order.customerDescription
					.split(", ")
					.map((c) => getCustomerIcon(c))
					.join(" ")
				detailsText += ` | ${customers}`
			}

			// Add payment type if provided
			if (order.paymentType) {
				const paymentIcon = order.paymentType === "cash" ? "💵" : "💳"
				const paymentText = order.paymentType === "cash" ? "Cash" : "Card"
				detailsText += ` | ${paymentIcon} ${paymentText}`
			}

			// Add duration (time from order to served) if servedAt exists
			if (order.servedAt && order.timestamp) {
				const durationMs = order.servedAt - order.timestamp
				const minutes = Math.floor(durationMs / 60000)
				const seconds = Math.floor((durationMs % 60000) / 1000)
				const durationText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
				detailsText += ` | ⏱️ ${durationText}`
			}

			details.textContent = detailsText

			orderInfo.appendChild(details)

			// Actions container for restore button and completed badge
			const historyActions = document.createElement("div")
			historyActions.classList.add("history-actions")

			const restoreBtn = document.createElement("button")
			restoreBtn.classList.add("restore-order-btn")
			restoreBtn.textContent = "Restore"
			restoreBtn.addEventListener("click", (e) => {
				e.stopPropagation()
				if (confirm(`Restore order #${order.orderNo} to ongoing orders?`)) {
					orderService.restoreToOngoing(order.id)
					if (onOrderChange) onOrderChange()
				}
			})

			const completedBadge = document.createElement("div")
			completedBadge.classList.add("completed-badge")
			completedBadge.textContent = "Completed"

			historyActions.appendChild(restoreBtn)
			historyActions.appendChild(completedBadge)

			li.appendChild(orderNo)
			li.appendChild(orderInfo)
			li.appendChild(historyActions)

			// Create delete button (hidden by default, shown on swipe)
			const deleteBtn = document.createElement("button")
			deleteBtn.classList.add("delete-order-btn")
			deleteBtn.textContent = "Delete"

			deleteBtn.addEventListener("click", (e) => {
				e.stopPropagation()
				if (confirm(`Delete order #${order.orderNo} from history?`)) {
					orderService.removeOrder(order.id)
					wrapper.remove()
					if (onOrderChange) onOrderChange()
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
				li.style.transition = "none"
			}

			const onTouchMove = (e) => {
				if (!isSwiping) return
				currentX = e.touches[0].clientX
				const diff = currentX - startX

				// Allow left swipe (negative) or right swipe to reset (positive when swiped)
				if (diff < 0) {
					li.style.transform = `translateX(${Math.max(diff, -100)}px)`
				} else if (wrapper.classList.contains("swiped") && diff > 0) {
					li.style.transform = `translateX(${Math.min(-100 + diff, 0)}px)`
				}
			}

			const onTouchEnd = () => {
				if (!isSwiping) return
				isSwiping = false
				li.style.transition = "transform 0.3s ease"

				const diff = currentX - startX

				// If swiped left more than 50px, show delete button
				if (diff < -50) {
					li.style.transform = "translateX(-100px)"
					wrapper.classList.add("swiped")
				} else {
					// Reset position
					li.style.transform = "translateX(0)"
					wrapper.classList.remove("swiped")
				}
			}

			// Mouse events for desktop testing
			let isMouseDown = false
			const onMouseDown = (e) => {
				// Don't start swipe on button clicks
				if (e.target.tagName === "BUTTON") return
				startX = e.clientX
				currentX = startX
				isMouseDown = true
				li.style.transition = "none"
			}

			const onMouseMove = (e) => {
				if (!isMouseDown) return
				currentX = e.clientX
				const diff = currentX - startX

				// Allow left swipe (negative) or right swipe to reset (positive when swiped)
				if (diff < 0) {
					li.style.transform = `translateX(${Math.max(diff, -100)}px)`
				} else if (wrapper.classList.contains("swiped") && diff > 0) {
					li.style.transform = `translateX(${Math.min(-100 + diff, 0)}px)`
				}
			}

			const onMouseUp = () => {
				if (!isMouseDown) return
				isMouseDown = false
				li.style.transition = "transform 0.3s ease"

				const diff = currentX - startX

				// If swiped left more than 50px, show delete button
				if (diff < -50) {
					li.style.transform = "translateX(-100px)"
					wrapper.classList.add("swiped")
				} else {
					// Reset position
					li.style.transform = "translateX(0)"
					wrapper.classList.remove("swiped")
				}
			}

			li.addEventListener("touchstart", onTouchStart, { passive: true })
			li.addEventListener("touchmove", onTouchMove, { passive: true })
			li.addEventListener("touchend", onTouchEnd)
			li.addEventListener("mousedown", onMouseDown)
			li.addEventListener("mousemove", onMouseMove)
			li.addEventListener("mouseup", onMouseUp)
			li.addEventListener("mouseleave", onMouseUp)

			wrapper.appendChild(li)
			wrapper.appendChild(deleteBtn)
			dateOrdersList.appendChild(wrapper)
		})

		container.appendChild(dateOrdersList)
	})
}
