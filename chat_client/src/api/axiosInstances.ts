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




const loggedCookiesAPI = axios.create({
    baseURL: "/",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});


// Автоматическое обновление access-токена, если он был просрочен, используются cookies
loggedCookiesAPI.interceptors.response.use(

    (response) => response,

    async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        // Если пользователь не найден
        if(error.response && error.response.status === 404) {

          console.error(error.response.data);

          return Promise.reject(error);

        }


        if (error.response && error.response.status === 401 && !originalRequest._retry) {

            originalRequest._retry = true;

            try {

                await axios.post("http://127.0.0.1:8000/api/refresh-token_v2/", {}, 
                  { withCredentials: true, }
                );

                console.log("Refreshed access token....")


                return loggedCookiesAPI(originalRequest);

            } catch (refreshError: any) {
                
                // console.log(refreshError.response)

                // if (refreshError.response) {
                //   console.log('Статус кода:', error.response.status);
                //   console.log('Данные ошибки:', error.response.data);
                //   console.log('Заголовки ответа:', error.response.headers);
                // }

                await axios.post("http://127.0.0.1:8000/api/logout_v2/", {}, 
                  { withCredentials: true, }
                );

                console.log("Redirecting to login page. Refresh token might be expired....")

                // window.location.href = "/login";

                return Promise.reject(refreshError);
            }

        }

        return Promise.reject(error);

});





export { loggedAPI, loggedCookiesAPI };