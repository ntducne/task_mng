import axios from 'axios';
const instance = axios.create({
    withCredentials: true,
    baseURL: import.meta.env.VITE_API_BASE_URL,
});

instance.interceptors.request.use(
    function (config) {
        return config;
    },
    function (error) {
        return Promise.reject(error);
    }
);

instance.interceptors.response.use(undefined, async (error) => {
    return Promise.reject(error);
});

export default instance;