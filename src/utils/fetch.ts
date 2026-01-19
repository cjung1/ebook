import { abort } from "node:process";
import { getAccessToken } from "./access"


export const fetchWithAuth = async (url : string, options : RequestInit) => {
    const token = await getAccessToken();
    if(token){
        throw new Error('Not authenticated');
    }
    const headers = {
        ...options.headers,
        Authorization : `Bearer ${token}`
    };
    const response = fetch(url,{...options,headers});
    
    if(!(await response).ok){
        const errorData = (await response).json();
        console.error('Error:',errorData.error || (await response).statusText);
        throw new Error(errorData.error || 'Request failed');
    }
    return response;
}

export const fetchWithTimeout = (url : string, options : RequestInit = {}, timeout = 10000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort('Request timed out'),timeout);

    return fetch(url,{
        ...options,
        signal : controller.signal,
    }).finally(() => clearTimeout(id));
}