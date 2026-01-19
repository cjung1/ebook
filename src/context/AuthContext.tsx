import React,{createContext,useContext} from 'react';
import {User} from '@supabase/supabase-js';


interface AuthContextType {
    token : string|null;
    user : User|null;
    login : (token : string,user : User) => void;
    logout : () => void;
}

const AuthContext = createContext<AuthContextType|undefined>(undefined);

export const useAuth = () : AuthContextType => {
    const context = useContext(AuthContext);
    if(!context){
        throw new Error('useAuth must be used within authProvider');
    }
    return context;
};
