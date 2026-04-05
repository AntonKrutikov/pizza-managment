import { config } from './firebase.js'

const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(config)
const auth = firebase.auth()
const db = firebase.firestore()

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

async function loadBackups(uid) {
  const snapshot = await db
    .collection('backup')
    .doc(uid)
    .collection('history')
    .orderBy('clientTimestamp', 'desc')
    .limit(50)
    .get()

  if (snapshot.empty) {
    setStatus('No backups found for this UID.', 'info')
    return
  }

  const limitNote = snapshot.size === 50 ? ' (showing most recent 50)' : ''
  setStatus(`${snapshot.size} backup(s) found${limitNote}.`, 'success')
  renderBackups(snapshot.docs)
}

function renderBackups(docs) {
  results.innerHTML = ''
  docs.forEach(doc => {
    const data = doc.data()
    // clientTimestamp is an ISO string (e.g. "2026-03-28T10:00:00.000Z") written by firebase.js
    // Use clientTimestamp, not backupTimestamp (which is a Firestore Timestamp object requiring .toDate())
    const date = data.clientTimestamp
      ? new Date(data.clientTimestamp).toLocaleString()
      : 'Unknown date'
    const orderCount = Array.isArray(data.orders) ? data.orders.length : 0

    const card = document.createElement('div')
    card.className = 'backup-card'

    const meta = document.createElement('div')
    meta.className = 'backup-meta'

    const dateEl = document.createElement('div')
    dateEl.className = 'backup-date'
    dateEl.textContent = date

    const ordersEl = document.createElement('div')
    ordersEl.className = 'backup-orders'
    ordersEl.textContent = `${orderCount} order${orderCount !== 1 ? 's' : ''}`

    const dlBtn = document.createElement('button')
    dlBtn.className = 'btn-download'
    dlBtn.textContent = 'Download'
    dlBtn.addEventListener('click', () => downloadBackup(data))

    meta.appendChild(dateEl)
    meta.appendChild(ordersEl)
    card.appendChild(meta)
    card.appendChild(dlBtn)
    results.appendChild(card)
  })
}

function downloadBackup(data) {
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
