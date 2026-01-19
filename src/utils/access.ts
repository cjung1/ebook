import { isWebAppPlatform } from "../services/environment"
import { supabase } from "./supabase";

export const getAccessToken  = async () : Promise<string | null> => {
    if(isWebAppPlatform()){
        return localStorage.getItem('token') ?? null;
    }
    const {data} = await supabase.auth.getSession();

    return data?.session?.access_token ?? null;
}