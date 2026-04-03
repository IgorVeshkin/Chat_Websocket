import { useState, useEffect } from "react";

const useFetchData = <T,>(api_endpoint_url: string): { data: T | null, loading: boolean, error: string | null } => {

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    // Подгрузка данных api
    useEffect(() => {

        const fetchChatroom = async () => {

        setLoading(true)
        
        try {

            const response = await fetch(api_endpoint_url);
            
            if(!response.ok) {
                
                throw new Error("Fetching wasn't successful")
            }

            const response_json = await response.json()

            setData(response_json)

        } catch (e: any) {
            
            const errorMessage = e instanceof Error ? e.message : String(e);

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