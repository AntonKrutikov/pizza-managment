import { config } from './firebase.js'

const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(config)
const auth = firebase.auth()
const db = firebase.firestore()
const storage = firebase.storage()

const uidInput = document.getElementById('uid-input')
const loadBtn = document.getElementById('load-btn')
const statusMsg = document.getElementById('status-msg')
const results = document.getElementById('results')

function setStatus(text, type = 'info') {
  statusMsg.textContent = text
  statusMsg.className = `message ${type}`
}

// Note: the anonymous auth UID is only needed to satisfy Firestore security rules.
// The user-entered UID (passed to loadBackups) is the actual data lookup key.
async function ensureAuth() {
  if (auth.currentUser) return
  await auth.signInAnonymously()
}

loadBtn.addEventListener('click', async () => {
  const uid = uidInput.value.trim()
  if (!uid) {
    setStatus('Please enter a UID.', 'error')
    return
  }

  loadBtn.disabled = true
  results.innerHTML = ''
  setStatus('Connecting…', 'info')

  try {
    await ensureAuth()
    setStatus('Authenticated. Loading backups…', 'info')
    await loadBackups(uid)
  } catch (err) {
    const msg = err.code === 'permission-denied'
      ? 'Could not access backups — check your UID.'
      : `Error: ${err.message}`
    setStatus(msg, 'error')
  } finally {
    loadBtn.disabled = false
  }
})

uidInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') loadBtn.click()
})

// Dual-read: new backups live in Cloud Storage (backups/{uid}/*.json),
// legacy backups remain in Firestore (/backup/{uid}/history). Both are
// listed, merged, and shown so no historical backup is ever lost.
async function loadBackups(uid) {
  const [storageItems, firestoreItems] = await Promise.all([
    listStorageBackups(uid),
    listFirestoreBackups(uid)
  ])

  const all = [...storageItems, ...firestoreItems].sort(
    (a, b) => b.sortKey.localeCompare(a.sortKey)
  )

  if (all.length === 0) {
    setStatus('No backups found for this UID.', 'info')
    return
  }

  const shown = all.slice(0, 50)
  const limitNote = all.length > 50 ? ' (showing most recent 50)' : ''
  setStatus(`${all.length} backup(s) found${limitNote}.`, 'success')
  renderBackups(shown)
}

// Returns normalized records: { source, sortKey, date, orderCount, download }
async function listStorageBackups(uid) {
  let listing
  try {
    listing = await storage.ref(`backups/${uid}`).listAll()
  } catch (err) {
    // A missing prefix is not an error; anything else, fail loudly.
    if (err.code === 'storage/object-not-found') return []
    throw err
  }

  return Promise.all(
    listing.items.map(async item => {
      const meta = await item.getMetadata()
      const cm = meta.customMetadata || {}
      const ts = cm.clientTimestamp || meta.timeCreated || ''
      const orderCount = cm.orderCount != null ? Number(cm.orderCount) : null
      return {
        source: 'storage',
        sortKey: ts,
        date: ts ? new Date(ts).toLocaleString() : 'Unknown date',
        orderCount,
        download: () => downloadFromStorage(item)
      }
    })
  )
}

async function listFirestoreBackups(uid) {
  let snapshot
  try {
    snapshot = await db
      .collection('backup')
      .doc(uid)
      .collection('history')
      .orderBy('clientTimestamp', 'desc')
      .limit(50)
      .get()
  } catch (err) {
    if (err.code === 'permission-denied') return []
    throw err
  }

  return snapshot.docs.map(doc => {
    const data = doc.data()
    // clientTimestamp is an ISO string written by the old firebase.js path.
    const ts = data.clientTimestamp || ''
    return {
      source: 'firestore',
      sortKey: ts,
      date: ts ? new Date(ts).toLocaleString() : 'Unknown date',
      orderCount: Array.isArray(data.orders) ? data.orders.length : 0,
      download: () => downloadFirestoreBackup(data)
    }
  })
}

function renderBackups(records) {
  results.innerHTML = ''
  records.forEach(rec => {
    const card = document.createElement('div')
    card.className = 'backup-card'

    const meta = document.createElement('div')
    meta.className = 'backup-meta'

    const dateEl = document.createElement('div')
    dateEl.className = 'backup-date'
    dateEl.textContent = rec.date

    const ordersEl = document.createElement('div')
    ordersEl.className = 'backup-orders'
    const countText = rec.orderCount == null
      ? 'order count unknown'
      : `${rec.orderCount} order${rec.orderCount !== 1 ? 's' : ''}`
    ordersEl.textContent = countText

    const dlBtn = document.createElement('button')
    dlBtn.className = 'btn-download'
    dlBtn.textContent = 'Download'
    dlBtn.addEventListener('click', async () => {
      dlBtn.disabled = true
      try {
        await rec.download()
      } catch (err) {
        setStatus(`Download failed: ${err.message}`, 'error')
      } finally {
        dlBtn.disabled = false
      }
    })

    meta.appendChild(dateEl)
    meta.appendChild(ordersEl)
    card.appendChild(meta)
    card.appendChild(dlBtn)
    results.appendChild(card)
  })
}

// Storage objects were written with Content-Disposition: attachment,
// so opening the tokenized URL downloads the file with its filename.
async function downloadFromStorage(item) {
  const url = await item.getDownloadURL()
  const a = document.createElement('a')
  a.href = url
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function downloadFirestoreBackup(data) {
  const payload = {
    orders: data.orders || [],
    orderCounter: data.orderCounter || 0
  }

  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const dateStr = data.clientTimestamp
    ? new Date(data.clientTimestamp).toISOString().slice(0, 10)
    : 'unknown'

  const a = document.createElement('a')
  a.href = url
  a.download = `pizza-backup-${dateStr}.json`
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
