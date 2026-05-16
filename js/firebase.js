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
let storage = null

/**
 * Initialize Firebase (idempotent - safe to call multiple times)
 */
export function initializeFirebase() {
	if (app) return { app, auth, db, storage }

	// Use global firebase object from CDN
	app = firebase.initializeApp(config)
	auth = firebase.auth()
	db = firebase.firestore()
	storage = firebase.storage()

	return { app, auth, db, storage }
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
 * Backup LocalStorage data to Cloud Storage.
 *
 * Each backup is a standalone JSON file at: backups/{uid}/{timestamp}.json
 * This replaces the previous single-Firestore-document approach, which hit
 * Firestore's hard 1MB/document limit once enough orders accumulated.
 * Cloud Storage has no such per-object size limit.
 *
 * Function name/return shape are kept unchanged so existing callers
 * (main.js, Settings UI) need no modification.
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
	const clientTimestamp = new Date().toISOString()

	// Backup payload — same shape the Backup Manager expects on download
	const payload = {
		orders: data.orders || [],
		orderCounter: data.orderCounter || 0,
		clientTimestamp,
		deviceInfo: {
			userAgent: navigator.userAgent,
			platform: navigator.platform
		}
	}

	// Sortable, filesystem-safe object name (ISO with ':' and '.' -> '-')
	const safeStamp = clientTimestamp.replace(/[:.]/g, '-')
	const objectPath = `backups/${uid}/${safeStamp}.json`
	const downloadName = `pizza-backup-${clientTimestamp.slice(0, 10)}.json`

	const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })

	// contentDisposition makes the tokenized download URL save as a file
	// (no bucket CORS config needed). customMetadata feeds the Backup
	// Manager list view (Storage metadata values must be strings).
	const metadata = {
		contentType: 'application/json',
		contentDisposition: `attachment; filename="${downloadName}"`,
		customMetadata: {
			orderCount: String(payload.orders.length),
			orderCounter: String(payload.orderCounter),
			clientTimestamp
		}
	}

	const ref = storage.ref(objectPath)
	await ref.put(blob, metadata)

	// Verify the object actually landed before declaring success.
	// Only then update the local "last backup" marker.
	const written = await ref.getMetadata()
	if (!written || !written.size) {
		throw new Error('Backup upload could not be verified')
	}

	localStorage.setItem(BACKUP_TIMESTAMP_KEY, clientTimestamp)

	return {
		uid,
		timestamp: clientTimestamp,
		ordersCount: payload.orders.length
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
