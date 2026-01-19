'use client';

import { SyncClient } from "../libs/sync";
import { createContext, useContext } from "react";



const syncClient = new SyncClient();

interface SyncContextType{
    syncClient : SyncClient;
}

const SyncContext = createContext<SyncContextType>({syncClient});

export const useSyncContext = () => {
    useContext(SyncContext);
}