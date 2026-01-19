import { useCallback, useRef } from "react";
import { useAuth } from "../../../context/AuthContext"
import { useSync } from "../../../hooks/useSyns";
import { useLibraryStore } from "../../../store/libraryStore";

export const useBooksSync = () => {
    const {user} = useAuth;

    const {syncBooks,lastSyncedAtBooks} = useSync();

    const isPullingRef = useRef(false);
    const getNewBooks = useCallback(() => {
        if(!user){
            return {};
        }
        const library = useLibraryStore.getState().library;
        const newBooks = library.filter(
            (book) => 
                !book.syncedAt ||
                lastSyncedAtBooks < book.updatedAt ||
                lastSyncedAtBooks < (book.deletedAt ?? 0)
        );
        return {
            books : newBooks,
            lastSyncedAt : lastSyncedAtBooks
        };
    },[user,lastSyncedAtBooks]);

    const pullLibrary = useCallback(async() => {
        if(!user){
            return;
        }
        if(isPullingRef.current){
            console.log('Pull already in progress,skipping...');
            return;
        }
        try{
            isPullingRef.current = true;
            await syncBooks([],'pull');
        }
        finally{
            isPullingRef.current = false;
        }
        
    },[user,syncBooks]);

    const pushLibrary = useCallback(async() => {
        if(!user){
            return;
        }
        const newBooks = getNewBooks();
        if(newBooks.lastSyncedAt){
            await syncBooks(newBooks?.books,'push');
        }
    },[user,syncBooks,getNewBooks]);

    return{pullLibrary,pushLibrary};
}