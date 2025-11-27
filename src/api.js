const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export async function login(email, password, accessCode) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, accessCode })
  })
  if (!res.ok) throw new Error('Login failed')
  return res.json()
}

export async function listPatients(token) {
  const res = await fetch(`${API_BASE}/api/patients`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('List patients failed')
  return res.json()
}

export async function createPatient(token, data) {
  const res = await fetch(`${API_BASE}/api/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    let msg = 'Create patient failed'
    try { const j = await res.json(); msg = j?.error || msg } catch { try { msg = await res.text() } catch { void 0 } }
    throw new Error(msg)
  }
  return res.json()
}

export async function updatePatient(token, id, data) {
  const res = await fetch(`${API_BASE}/api/patients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Update patient failed')
  return res.json()
}

export async function deletePatient(token, id) {
  const res = await fetch(`${API_BASE}/api/patients/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Delete patient failed')
  return res.json()
}

export async function listServices(token) {
  const res = await fetch(`${API_BASE}/api/services`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('List services failed')
  return res.json()
}

export async function createService(token, data) {
  const res = await fetch(`${API_BASE}/api/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Create service failed')
  return res.json()
}

export async function updateService(token, id, data) {
  const res = await fetch(`${API_BASE}/api/services/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Update service failed')
  return res.json()
}

export async function deleteService(token, id) {
  const res = await fetch(`${API_BASE}/api/services/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Delete service failed')
  return res.json()
}

export async function sendEmail(token, data) {
  const res = await fetch(`${API_BASE}/api/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    let msg = 'Send email failed'
    try { const j = await res.json(); msg = j?.error || msg } catch { try { msg = await res.text() } catch { void 0 } }
    throw new Error(msg)
  }
  return res.json()
}
