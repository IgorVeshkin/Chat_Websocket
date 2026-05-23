import { Navigate, Outlet, useOutletContext } from "react-router-dom";

import { useState, useEffect } from "react";

import { loggedCookiesAPI } from "./api/axiosInstances";


interface loggedUser {
    username: string,
    first_name: string,
    last_name: string,
    is_auth: boolean,
}

interface outletType {
    loggedUserData: loggedUser | null
}


const ProtectedRoute = ( Route: any ) => {

    const [isAuth, setIsAuth] = useState<boolean | null>(null)
    const [loggedUserData, setLoggedUserData] = useState<loggedUser | null>() 

    useEffect(() => {

        const getUser = async () => {

            await loggedCookiesAPI.get("http://127.0.0.1:8000/api/check-auth/").then(response => {
                
                setIsAuth(response.data.is_auth);

                setLoggedUserData(response.data)

                console.log("Данные успешно получены: " + JSON.stringify(response.data));

            }).catch(error => {

                console.log(error);

                setIsAuth(false);

            })
        }

        getUser();

    }, []);

    if (isAuth === null) {
        return <div style={{ display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh", }}><h3>Loading...</h3></div>

    }

    if (isAuth === false) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet context={{ loggedUserData }} />;

}

export default ProtectedRoute;


export function useLoggedUserData() {
  return useOutletContext<outletType>();
}