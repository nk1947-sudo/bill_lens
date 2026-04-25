import axios from 'axios'

// In production (Vercel), VITE_API_URL points to the deployed backend service.
// In local dev, empty string falls back to Vite's /api proxy.
const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

const client = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use(config => {
  const token = localStorage.getItem('mb_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mb_token')
      localStorage.removeItem('mb_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default client
