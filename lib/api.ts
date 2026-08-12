import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

const api = axios.create({
    baseURL: `${BASE_URL}/central`,
    withCredentials: true,
})

// Attach token from localStorage on each request
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('centralAdminToken')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
    }
    return config
})

// Redirect to login on 401
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('centralAdminToken')
            localStorage.removeItem('centralAdmin')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api
