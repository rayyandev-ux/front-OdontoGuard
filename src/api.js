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

export async function listDeletedPatients(token) {
  const res = await fetch(`${API_BASE}/api/patients/deleted`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('List deleted patients failed')
  return res.json()
}

export async function recoverPatient(token, id) {
  const res = await fetch(`${API_BASE}/api/patients/${id}/recover`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Recover patient failed')
  return res.json()
}

export async function extractPatientFromImages(token, images) {
  const res = await fetch(`${API_BASE}/api/ai/extract-patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ images })
  })
  if (!res.ok) {
    let msg = 'AI extract failed'
    try { const j = await res.json(); msg = j?.error || msg } catch { try { msg = await res.text() } catch { void 0 } }
    throw new Error(msg)
  }
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

export async function listAppointments(token) {
  const res = await fetch(`${API_BASE}/api/appointments`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('List appointments failed')
  return res.json()
}

export async function createAppointment(token, data) {
  const res = await fetch(`${API_BASE}/api/appointments`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) })
  if (!res.ok) {
    let msg = 'Create appointment failed'
    try { const j = await res.json(); msg = j?.error || msg } catch { try { msg = await res.text() } catch { void 0 } }
    throw new Error(msg)
  }
  return res.json()
}

export async function updateAppointment(token, id, data) {
  const res = await fetch(`${API_BASE}/api/appointments/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) })
  if (!res.ok) {
    let msg = 'Update appointment failed'
    try { const j = await res.json(); msg = j?.error || msg } catch { try { msg = await res.text() } catch { void 0 } }
    throw new Error(msg)
  }
  return res.json()
}

export async function deleteAppointment(token, id) {
  const res = await fetch(`${API_BASE}/api/appointments/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('Delete appointment failed')
  return res.json()
}

export async function listReminderRules(token) {
  const res = await fetch(`${API_BASE}/api/reminder-rules`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('List reminder rules failed')
  return res.json()
}

export async function createReminderRule(token, data) {
  const res = await fetch(`${API_BASE}/api/reminder-rules`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) })
  if (!res.ok) throw new Error('Create reminder rule failed')
  return res.json()
}

export async function updateReminderRule(token, id, data) {
  const res = await fetch(`${API_BASE}/api/reminder-rules/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) })
  if (!res.ok) throw new Error('Update reminder rule failed')
  return res.json()
}

export async function deleteReminderRule(token, id) {
  const res = await fetch(`${API_BASE}/api/reminder-rules/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('Delete reminder rule failed')
  return res.json()
}

export async function listReminders(token) {
  const res = await fetch(`${API_BASE}/api/reminders`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('List reminders failed')
  return res.json()
}

export async function createReminder(token, data) {
  const res = await fetch(`${API_BASE}/api/reminders`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) })
  if (!res.ok) {
    let msg = 'Create reminder failed'
    try { const j = await res.json(); msg = j?.error || msg } catch { try { msg = await res.text() } catch { void 0 } }
    throw new Error(msg)
  }
  return res.json()
}

export async function processDueReminders(token) {
  const res = await fetch(`${API_BASE}/api/reminders/process-due`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('Process reminders failed')
  return res.json()
}

export async function sendReminderNow(token, id) {
  const res = await fetch(`${API_BASE}/api/reminders/${id}/send-now`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    let msg = 'Send now failed'
    try { const j = await res.json(); msg = j?.error || msg } catch { try { msg = await res.text() } catch { void 0 } }
    throw new Error(msg)
  }
  return res.json()
}

export async function deleteReminder(token, id) {
  const res = await fetch(`${API_BASE}/api/reminders/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    let msg = 'Delete reminder failed'
    try { const j = await res.json(); msg = j?.error || msg } catch { try { msg = await res.text() } catch { void 0 } }
    throw new Error(msg)
  }
  return res.json()
}

export async function listMessageLogs(token, params = {}) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${API_BASE}/api/message-logs${qs ? `?${qs}` : ''}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('List message logs failed')
  return res.json()
}

export async function listControlSchedules(token) {
  const res = await fetch(`${API_BASE}/api/control-schedules`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('List control schedules failed')
  return res.json()
}

export async function createControlSchedule(token, data) {
  const res = await fetch(`${API_BASE}/api/control-schedules`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) })
  if (!res.ok) {
    let msg = 'Create control schedule failed'
    try { const j = await res.json(); msg = j?.error || msg } catch { try { msg = await res.text() } catch { void 0 } }
    throw new Error(msg)
  }
  return res.json()
}

export async function deleteControlSchedule(token, id) {
  const res = await fetch(`${API_BASE}/api/control-schedules/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('Delete control schedule failed')
  return res.json()
}
