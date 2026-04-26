import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig} from "axios";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}


const loggedAPI = axios.create({
    baseURL: "/",
    headers: {
        "Content-Type": "application/json",
    },
});


// Автоматическое добавление access-токена в каждый запрос текущего axios-instance
loggedAPI.interceptors.request.use((config: InternalAxiosRequestConfig) => {

    const accessToken = localStorage.getItem("access");

    if (accessToken) {
        config.headers = config.headers || {};
        (config.headers as any).Authorization = `Bearer ${accessToken}`;
    }

    return config;

    },

    error => Promise.reject(error)

);


/* loggedAPI.interceptors.response.use(

  (response) => response,

  (error) => {

    if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.log('401 Unauthorized detected in interceptor');
      
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');

        window.location.href = '/login';

    }

    return Promise.reject(error);

  }
); */

// Автоматическое обновление access-токена, если он был просрочен, используется текущий axios-instance
loggedAPI.interceptors.response.use(

    (response) => response,

    async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        // Если нет токена для обновления (Возможно, лучше реализовать через Protected Route)
        /* if (!localStorage.getItem("refresh")) {

            window.location.href = "/login";

        } */

        if (error.response && error.response.status === 401 && !originalRequest._retry && localStorage.getItem("refresh")) {

            originalRequest._retry = true;

            try {

                const refreshToken = localStorage.getItem("refresh");

                const AccessTokenRequest = await axios.post("http://127.0.0.1:8000/api/refresh-token/", {
                    refresh: refreshToken,
                }
            );

                const newAccessToken = AccessTokenRequest.data.access;

                localStorage.setItem("access", newAccessToken);
                
                originalRequest.headers = originalRequest.headers || {};
                (originalRequest.headers as any).Authorization = `Bearer ${newAccessToken}`;

                return loggedAPI(originalRequest);

            } catch (refreshError) {

                localStorage.removeItem("access");
                localStorage.removeItem("refresh");

                window.location.href = "/login";

                return Promise.reject(refreshError);
            }

        }

        return Promise.reject(error);

});


/*

// Response interceptor
loggedAPI.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // Check for 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry && localStorage.getItem("refresh")) {
      originalRequest._retry = true; // avoid infinite loops

      try {
        const refreshToken = localStorage.getItem("refresh");

        // Call refresh token API
        const response = await axios.post("http://127.0.0.1:8000/api/refresh-token", {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;

        localStorage.setItem("access", newAccessToken);

        // Update original request headers with new token
        originalRequest.headers = originalRequest.headers || {};
        (originalRequest.headers as any).Authorization = `Bearer ${newAccessToken}`;

        // Retry original request with new token
        return loggedAPI(originalRequest);

      } catch (refreshError) {
        // Refresh token failed, remove tokens and redirect to login
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";

        // reject the promise
        return Promise.reject(refreshError);
      }
    }

    // If error is not handled above, reject as usual
    return Promise.reject(error);
  }
);

*/


export default loggedAPI;