import { useState, useEffect } from "react";

import axios from 'axios'

import { loggedCookiesAPI } from "../api/axiosInstances";

const useFetchData = <T,>(api_endpoint_url: string): { data: T | null, loading: boolean, error: string | null } => {

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    // Подгрузка данных api
    useEffect(() => {

        const fetchChatroom = async () => {

        setLoading(true)
        
        try {

            const response = await loggedCookiesAPI.get(api_endpoint_url);

            const response_data = response.data

            setData(response_data)

        } catch (e: any) {

            const errorMessage = axios.isAxiosError(e)
            ? e.response
            ? `Error: ${e.response.status} - ${e.response.statusText}`
            : e.message
            : String(e);

            setError(errorMessage)

            console.log("Error: ", errorMessage)

        } finally {

            setLoading(false)

            console.log('Fetching is complete....')
        }

        }

        fetchChatroom();

    }, [api_endpoint_url])

    return { data, loading, error }

}

export default useFetchData;