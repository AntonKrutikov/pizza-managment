/**
 * Add Items Popup - Multi-item selection for adding to existing orders
 */

// State for the popup
let addItemsPopupState = {
	orderId: null,
	orderNo: null,
	selectedItems: [],
	menuData: null,
	orderService: null,
	updateCallback: null,
	customPriceItem: null
}

/**
 * Initialize the add items popup with menu data and service references
 */
export function initAddItemsPopup(menuData, orderService, updateCallback) {
	addItemsPopupState.menuData = menuData
	addItemsPopupState.orderService = orderService
	addItemsPopupState.updateCallback = updateCallback

	// Cancel button
	document.getElementById('add-items-cancel').addEventListener('click', hideAddItemsPopup)

	// Confirm button
	document.getElementById('add-items-confirm').addEventListener('click', () => {
		if (addItemsPopupState.selectedItems.length > 0 && addItemsPopupState.orderId) {
			addItemsPopupState.orderService.addItemsToOrder(
				addItemsPopupState.orderId,
				addItemsPopupState.selectedItems
			)
			hideAddItemsPopup()
		}
	})

	// Close on overlay click
	document.getElementById('add-items-popup').addEventListener('click', (e) => {
		if (e.target.id === 'add-items-popup') {
			hideAddItemsPopup()
		}
	})

	// Custom price popup handlers
	document.getElementById('add-items-custom-price-cancel').addEventListener('click', hideCustomPricePopup)
	document.getElementById('add-items-custom-price-confirm').addEventListener('click', confirmCustomPrice)
	document.getElementById('add-items-custom-price-input').addEventListener('input', updateCustomPriceButton)
	document.getElementById('add-items-custom-price-input').addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			const btn = document.getElementById('add-items-custom-price-confirm')
			if (!btn.disabled) btn.click()
		}
		if (e.key === 'Escape') hideCustomPricePopup()
	})

	// Close custom price on overlay click
	document.getElementById('add-items-custom-price-popup').addEventListener('click', (e) => {
		if (e.target.id === 'add-items-custom-price-popup') {
			hideCustomPricePopup()
		}
	})

	// Close main popup on Escape key
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') {
			const popup = document.getElementById('add-items-popup')
			const customPopup = document.getElementById('add-items-custom-price-popup')
			if (customPopup.style.display === 'flex') {
				hideCustomPricePopup()
			} else if (popup.style.display === 'flex') {
				hideAddItemsPopup()
			}
		}
	})
}

/**
 * Show the add items popup for a specific order
 */
export function showAddItemsPopup(orderId, orderNo) {
	addItemsPopupState.orderId = orderId
	addItemsPopupState.orderNo = orderNo
	addItemsPopupState.selectedItems = []

	document.getElementById('add-items-order-no').textContent = `#${orderNo}`

	renderMenuForPopup()
	updateCartDisplay()

	document.getElementById('add-items-popup').style.display = 'flex'
}

/**
 * Hide the add items popup and reset state
 */
export function hideAddItemsPopup() {
	document.getElementById('add-items-popup').style.display = 'none'
	addItemsPopupState.orderId = null
	addItemsPopupState.orderNo = null
	addItemsPopupState.selectedItems = []
}

/**
 * Render the menu inside the popup
 */
function renderMenuForPopup() {
	const container = document.getElementById('add-items-menu-container')
	container.innerHTML = ''

	if (!addItemsPopupState.menuData) return

	addItemsPopupState.menuData.categories.forEach(category => {
		const header = document.createElement('h3')
		header.classList.add('category-header')
		header.textContent = category.name
		container.appendChild(header)

		const grid = document.createElement('div')
		grid.classList.add('menu-items-grid')

		category.items.forEach(item => {
			const card = createPopupMenuItemCard(item)
			grid.appendChild(card)
		})

		container.appendChild(grid)
	})
}

/**
 * Create a menu item card for the popup (similar to main.js createMenuItemCard)
 */
function createPopupMenuItemCard(item) {
	const card = document.createElement('div')
	card.classList.add('menu-item-card')

	if (item.customPrice) {
		card.classList.add('custom-price-card')
	}

	// Image handling (same as main.js)
	if (item.baseImage && item.iconImage) {
		const imageContainer = document.createElement('div')
		imageContainer.classList.add('item-image-sidebyside')

		const leftImg = document.createElement('img')
		leftImg.src = item.baseImage
		leftImg.alt = 'Quesadilla'
		leftImg.classList.add('item-image-left')

		const rightImg = document.createElement('img')
		rightImg.src = item.iconImage
		rightImg.alt = item.name
		rightImg.classList.add('item-image-right')
		rightImg.classList.add(`type-${item.name.toLowerCase().replace(/\s+/g, '-')}`)

		imageContainer.appendChild(leftImg)
		imageContainer.appendChild(rightImg)
		card.appendChild(imageContainer)
	} else if (item.image) {
		const img = document.createElement('img')
		img.src = item.image
		img.alt = item.name
		img.classList.add('item-image')
		card.appendChild(img)
	}

	const nameSpan = document.createElement('span')
	nameSpan.classList.add('item-name')
	nameSpan.textContent = item.name
	card.appendChild(nameSpan)

	const priceSpan = document.createElement('span')
	priceSpan.classList.add('item-price')

	if (item.customPrice) {
		priceSpan.textContent = 'Custom'
	} else if (item.variants) {
		const prices = item.variants.map(v => v.price)
		const minPrice = Math.min(...prices)
		const maxPrice = Math.max(...prices)
		priceSpan.textContent = minPrice === maxPrice ? `${minPrice} THB` : `${minPrice}-${maxPrice} THB`
	} else {
		priceSpan.textContent = `${item.price} THB`
	}
	card.appendChild(priceSpan)

	// Action buttons
	const actionsDiv = document.createElement('div')
	actionsDiv.classList.add('item-actions')

	const imageData = item.baseImage && item.iconImage
		? { baseImage: item.baseImage, iconImage: item.iconImage }
		: item.image || null

	if (item.customPrice) {
		const btn = document.createElement('button')
		btn.type = 'button'
		btn.classList.add('add-item-btn-card')
		btn.textContent = 'Set Price'
		btn.addEventListener('click', (e) => {
			e.stopPropagation()
			showCustomPricePopupForAdd(item.name, imageData)
		})
		actionsDiv.appendChild(btn)
	} else if (item.variants) {
		item.variants.forEach(variant => {
			const btn = document.createElement('button')
			btn.type = 'button'
			btn.classList.add('add-variant-btn')
			btn.textContent = `Add ${variant.size}`
			btn.addEventListener('click', (e) => {
				e.stopPropagation()
				addItemToCart(`${item.name} (${variant.size})`, variant.price, imageData)
				card.classList.remove('selected')
			})
			actionsDiv.appendChild(btn)
		})
	} else {
		const btn = document.createElement('button')
		btn.type = 'button'
		btn.classList.add('add-item-btn-card')
		btn.textContent = 'Add'
		btn.addEventListener('click', (e) => {
			e.stopPropagation()
			addItemToCart(item.name, item.price, imageData)
			card.classList.remove('selected')
		})
		actionsDiv.appendChild(btn)
	}

	card.appendChild(actionsDiv)

	// Handle card selection (scoped to popup menu only)
	card.addEventListener('click', () => {
		document.querySelectorAll('#add-items-menu-container .menu-item-card').forEach(c => c.classList.remove('selected'))
		card.classList.add('selected')
	})

	return card
}

/**
 * Add item to the cart (selected items list)
 */
function addItemToCart(name, price, image) {
	addItemsPopupState.selectedItems.push({
		name,
		price,
		image
	})
	updateCartDisplay()
}

/**
 * Remove item from cart by index
 */
function removeItemFromCart(index) {
	addItemsPopupState.selectedItems.splice(index, 1)
	updateCartDisplay()
}

/**
 * Update the cart display (header summary, cart list, confirm button)
 */
function updateCartDisplay() {
	const items = addItemsPopupState.selectedItems
	const count = items.length
	const total = items.reduce((sum, item) => sum + parseInt(item.price), 0)

	// Update header summary
	document.getElementById('add-items-count').textContent = `${count} item${count !== 1 ? 's' : ''}`
	document.getElementById('add-items-total').textContent = `${total} THB`

	// Update button
	document.getElementById('add-items-btn-count').textContent = count
	document.getElementById('add-items-btn-total').textContent = total
	document.getElementById('add-items-confirm').disabled = count === 0

	// Update cart list
	const cartContainer = document.getElementById('add-items-cart')
	const cartList = document.getElementById('add-items-cart-list')

	if (count === 0) {
		cartContainer.style.display = 'none'
	} else {
		cartContainer.style.display = 'block'
		cartList.innerHTML = ''

		items.forEach((item, index) => {
			const li = document.createElement('li')
			li.classList.add('add-items-cart-item')

			const infoDiv = document.createElement('div')
			infoDiv.classList.add('add-items-cart-item-info')

			// Add image if available
			if (item.image) {
				if (typeof item.image === 'string') {
					const img = document.createElement('img')
					img.src = item.image
					img.alt = item.name
					img.classList.add('add-items-cart-item-image')
					infoDiv.appendChild(img)
				} else if (item.image.baseImage) {
					// For composite images, just show the base image
					const img = document.createElement('img')
					img.src = item.image.baseImage
					img.alt = item.name
					img.classList.add('add-items-cart-item-image')
					infoDiv.appendChild(img)
				}
			}

			const nameSpan = document.createElement('span')
			nameSpan.classList.add('add-items-cart-item-name')
			nameSpan.textContent = item.name
			infoDiv.appendChild(nameSpan)

			const priceSpan = document.createElement('span')
			priceSpan.classList.add('add-items-cart-item-price')
			priceSpan.textContent = `${item.price} THB`

			const removeBtn = document.createElement('button')
			removeBtn.type = 'button'
			removeBtn.classList.add('add-items-cart-item-remove')
			removeBtn.textContent = 'Remove'
			removeBtn.addEventListener('click', () => removeItemFromCart(index))

			li.appendChild(infoDiv)
			li.appendChild(priceSpan)
			li.appendChild(removeBtn)
			cartList.appendChild(li)
		})
	}
}

// === Custom price popup functions ===

function showCustomPricePopupForAdd(itemName, imageData) {
	addItemsPopupState.customPriceItem = { itemName, imageData }
	document.getElementById('add-items-custom-price-input').value = ''
	document.getElementById('add-items-custom-price-confirm').disabled = true
	document.getElementById('add-items-custom-price-popup').style.display = 'flex'
	setTimeout(() => document.getElementById('add-items-custom-price-input').focus(), 100)
}

function hideCustomPricePopup() {
	document.getElementById('add-items-custom-price-popup').style.display = 'none'
	addItemsPopupState.customPriceItem = null
}

function updateCustomPriceButton() {
	const value = parseInt(document.getElementById('add-items-custom-price-input').value)
	document.getElementById('add-items-custom-price-confirm').disabled = !value || value <= 0
}

function confirmCustomPrice() {
	const price = parseInt(document.getElementById('add-items-custom-price-input').value)
	if (price > 0 && addItemsPopupState.customPriceItem) {
		const { itemName, imageData } = addItemsPopupState.customPriceItem
		addItemToCart(itemName, price, imageData)
		hideCustomPricePopup()
	}
}
