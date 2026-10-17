import axios from "axios";

export const api = axios.create({ baseURL: "/api",
                                              withCredentials: true })

api.interceptors.response.use(
    (r) => r,
    (e) => {
        if (e.response?.status === 401)
            window.location.href = "/login";
        return Promise.reject(e);
    }
)