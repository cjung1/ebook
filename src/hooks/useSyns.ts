import React, { useCallback, useState } from "react";
import { useSyncContext } from "../context/SyncContext";
import { SyncClient, SyncData, SyncOp, SyncResult, SyncType } from "../libs/sync";
import { Book, BookDataRecord } from "../types/book";
import { useSettingsStore } from "../store/settingStore";
import { useBookDataStore } from "../store/bookDataStore";
import { navigateToLogin } from "../utils/nav";


const [syncError,setSyncError] = useState<string|null>(null);
const {settings,setSettings} = useSettingsStore();
const {syncClient} = useSyncContext();
const {setConfig} = useBookDataStore();
const [syncResult,setSyncResult] = useState<SyncResult>({
    books : null,
    notes : null,
    configs : null
});

const computeMaxTimestamp = (records : BookDataRecord[]) : number => {
    let maxTime = 0;
    for(const rec of records){
        if(rec.updated_at){
            const updatedTime = new Date(rec.updated_at).getTime();
            maxTime = Math.max(maxTime,updatedTime);
        }
        if(rec.deleted_at){
            const deletedTime = new Date(rec.deleted_at).getTime();
            maxTime = Math.max(maxTime,deletedTime);
        }
    }
    return maxTime;
}

const [syncing,setSyncing] = useState(false);

const [lastSyncedAtInited,setLastSyncedAtInited] = useState(false);
const [lastSyncedAtBooks,setLastSyncedAtBooks] = useState<number>(0);

export function useSync(bookKey ?: string){
const pullChanges = async(
    type : SyncType,
    since : number,
    setLastSyncedAt : React.Dispatch<React.SetStateAction<number>>,
    setSyncing : React.Dispatch<React.SetStateAction<boolean>>,
    bookId ?: string,
    metaHash ?: string
) => {
    setSyncing(true);
    setSyncError(null);
    try{
        const result = await syncClient.pullChanges(since,type,bookId,metaHash);
        setSyncResult({...syncResult,[type] : result[type]});
        const records = result[type];
        if(!records?.length){
            return;
        }
        const maxTime = computeMaxTimestamp(records);
        setLastSyncedAt(maxTime);
        const settings = useSettingsStore.getState().settings;
        switch(type){
            case "books" :
                settings.lastSyncedAtBooks = maxTime;
                setSettings(settings);
                break;
            case 'configs' :
                if(!bookId){
                    settings.lastSyncedAtConfigs = maxTime;
                    setSettings(settings);
                }
                else if(bookKey){
                    setConfig(bookKey,{lastSyncedAtConfig : maxTime});
                }
                break;
            case 'notes':
                if(!bookId){
                    settings.lastSyncecAtNotes = maxTime;
                    setSettings(settings);
                }
                else if(bookKey){
                    setConfig(bookKey,{lastSyncedAtNotes : maxTime});
                }
                break;
        }
    }
    catch(err : unknown){
        console.error(err);
        if(err instanceof Error){
            if(err.message.includes('Not authenticated') && settings.keepLogin){
                settings.keepLogin = false;
                setSettings(settings);
                navigateToLogin(router);
            }
            setSyncError(err.message || `Error pulling ${type}`);
        }
        else{
            setSyncError(`Error pulling ${type}`);
        }
    }finally{
        setSyncing(false);
    }
}

const pushChanges = async (payload : SyncData) => {
    setSyncing(true);
    setSyncError(null);
    try{
        const result = await syncClient.pushChanges(payload);
        setSyncResult(result);
    }
    catch(err : unknown){
        console.error(err);
        if(err instanceof Error){
            setSyncError(err.message || 'Error pushing changes');
        }
        else{
            setSyncError('Error pushing changes');
        }
    } finally{
        setSyncing(false);
    }
}

const syncBooks = useCallback(
    async (books ?: Book[], op : SyncOp = 'both') => {
        if(!lastSyncedAtInited){
            return;
        }
        if((op === 'push' || op === 'both') && books?.length){
            await pushChanges({books});
        }
        if(op === 'pull' || op === 'both'){
            await pullChanges('books',lastSyncedAtBooks + 1,setLastSyncedAtBooks,setSyncingBooks);
        }
    },
    [lastSyncedAtInited,lastSyncedAtBooks]
)



}
