// Firebase configuration
export const config = {
	apiKey: "AIzaSyCkcEWvZqhs0RPrCyfmtzLNhKG_3H0TX1U",
	authDomain: "pizza-shop-b0657.firebaseapp.com",
	projectId: "pizza-shop-b0657",
	storageBucket: "pizza-shop-b0657.firebasestorage.app",
	messagingSenderId: "784278743718",
	appId: "1:784278743718:web:045b666db268be90936267",
}

// LocalStorage keys
const BACKUP_UID_KEY = 'pizzaShopBackupUid'
const BACKUP_TIMESTAMP_KEY = 'pizzaShopLastBackup'
const ORDERS_KEY = 'pizzaShopOrders'

// Firebase instances (initialized lazily)
let app = null
let auth = null
let db = null

/**
 * Initialize Firebase (idempotent - safe to call multiple times)
 */
export function initializeFirebase() {
	if (app) return { app, auth, db }

	// Use global firebase object from CDN
	app = firebase.initializeApp(config)
	auth = firebase.auth()
	db = firebase.firestore()

	return { app, auth, db }
}

/**
 * Get or create anonymous user ID
 * Stores UID in localStorage for consistency across sessions
 */
export async function ensureAnonymousAuth() {
	initializeFirebase()

	// Check if we have a stored UID
	const storedUid = localStorage.getItem(BACKUP_UID_KEY)

	// Check current auth state
	const currentUser = auth.currentUser

	if (currentUser && currentUser.uid === storedUid) {
		// Already authenticated with correct UID
		return currentUser.uid
	}

	// Sign in anonymously
	const credential = await auth.signInAnonymously()
	const uid = credential.user.uid

	// Store UID for future sessions
	localStorage.setItem(BACKUP_UID_KEY, uid)

	return uid
}

/**
 * Backup LocalStorage data to Firestore
 * Path: /backup/{uid}
 */
export async function backupToFirestore() {
	initializeFirebase()

	// Get authenticated user
	const uid = await ensureAnonymousAuth()

	// Get current LocalStorage data
	const ordersData = localStorage.getItem(ORDERS_KEY)
	if (!ordersData) {
		throw new Error('No data to backup')
	}

	const data = JSON.parse(ordersData)

	// Prepare backup document
	const backupDoc = {
		orders: data.orders || [],
		orderCounter: data.orderCounter || 0,
		backupTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
		clientTimestamp: new Date().toISOString(),
		deviceInfo: {
			userAgent: navigator.userAgent,
			platform: navigator.platform
		}
	}

	// Write to Firestore at /backup/{uid}/history/{auto-id}
	await db.collection('backup').doc(uid).collection('history').add(backupDoc)

	// Store backup timestamp locally
	const timestamp = new Date().toISOString()
	localStorage.setItem(BACKUP_TIMESTAMP_KEY, timestamp)

	return {
		uid,
		timestamp,
		ordersCount: backupDoc.orders.length
	}
}

/**
 * Get last backup info from localStorage
 */
export function getLastBackupInfo() {
	const timestamp = localStorage.getItem(BACKUP_TIMESTAMP_KEY)
	const uid = localStorage.getItem(BACKUP_UID_KEY)

	return {
		timestamp: timestamp || null,
		uid: uid || null,
		hasBackup: !!timestamp
	}
}
