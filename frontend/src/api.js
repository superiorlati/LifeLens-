
const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api"

async function apiPost(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  })
  if(!res.ok) throw new Error(await res.text())
  return res.json()
}

async function apiGet(path) {
  const res = await fetch(`${BASE}${path}`)
  if(!res.ok) throw new Error(await res.text())
  return res.json()
}

export { apiPost, apiGet }
