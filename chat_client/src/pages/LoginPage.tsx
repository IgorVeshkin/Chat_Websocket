import { useReducer } from 'react'

import { useNavigate } from "react-router-dom"

import { loggedCookiesAPI } from "../api/axiosInstances"


interface LoginState {
   username: string,
   password: string
}


const initialState: LoginState = {
    username: "",
    password: ""
}

const loginStateTypes = {
    SET_USERNAME: "SET_USERNAME",
    SET_PASSWORD: "SET_PASSWORD",
    RESET: "RESET"
    
} as const

type Action = {
    
    type: typeof loginStateTypes.SET_USERNAME;
    payload: string;

} | {

    type: typeof loginStateTypes.SET_PASSWORD;
    payload: string;

} | {

    type: typeof loginStateTypes.RESET;

};

const loginPageReducer = (state: LoginState, action: Action) : LoginState => {
    
    switch(action.type) {
        case loginStateTypes.SET_USERNAME:
            return {...state, username: action.payload}
        case loginStateTypes.SET_PASSWORD:
            return {...state, password: action.payload}
        case loginStateTypes.RESET:
            return {username: "", password: "",}
        default:
            return state

    }

}

function LoginPage() {

    const [authData, authDataDispatcher] = useReducer(loginPageReducer, initialState)


    const navigation = useNavigate()


    const handleSubmit = async (e: React.SubmitEvent) => {

        e.preventDefault();

        console.log("Username: " + authData.username + "\n" + "Password: " + authData.password)

        console.log(authData)


        try { 

            const response = await loggedCookiesAPI.post("http://127.0.0.1:8000/api/login_v2/", 
                authData, 
                {
                    headers: {                        
                        "Content-Type": "application/json",
                    },
                }

            )


            if (response.status === 200 || response.status === 201) {

                console.log(response.data)

                navigation("/")

             }


        } catch (e: any) {
            console.log(e)

        } finally {


        }
        

    }


    return (
        <form onSubmit={handleSubmit}>
            <h2>Вход в профиль</h2>
            <input type="text" placeholder='Username' value={authData.username} onChange={e => authDataDispatcher({ type: loginStateTypes.SET_USERNAME, payload: e.target.value })} />
            <input type="password" placeholder='Password' value={authData.password} onChange={e => authDataDispatcher({ type: loginStateTypes.SET_PASSWORD, payload: e.target.value })} />

            <button type='submit'>Войти</button>
        </form>
    )

}

export default LoginPage