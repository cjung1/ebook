'use client';


// import React, {createContext,useState,useContext} from 'react';
import {createContext,useContext} from 'react';

import { AppService } from '../types/system';


interface EnvContextType {
    AppService : AppService | null;
}

const EnvContext = createContext<EnvContextType | undefined>(undefined);


export const useEnv = () : EnvContextType => { // tai sao lai phai co const
    const context = useContext(EnvContext);
    if(!context){
        throw new Error('useEnv must be used within EnvProvider');
    }
    return context;
};


