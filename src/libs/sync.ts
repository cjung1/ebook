import { getAPIBaseUrl } from "../services/environment";
import { Book, BookConfig, BookDataRecord, BookNote } from "../types/book";
import { getAccessToken } from "../utils/access";
import { fetchWithTimeout } from "../utils/fetch";

const SYNC_API_ENDPOINT = getAPIBaseUrl() + '/sync';
export type SyncType = 'books' | 'configs' | 'notes';

interface BookRecord extends BookDataRecord,Book {};

interface BookConfigRecord extends BookDataRecord,BookConfig {};

interface BookNoteRecord extends BookDataRecord, BookNote {};

export interface SyncResult {
    books : BookRecord[] | null;
    notes : BookNoteRecord[] | null;
    configs : BookConfigRecord[] | null;
}

export interface SyncData {
    books ?: Partial<BookRecord>[];
    notes ?: Partial<BookNoteRecord>[];
    config ?: Partial<BookConfigRecord>[];
}

export class SyncClient{
    async pullChanges(
        since : number,
        type ?: SyncType,
        book ?: string,
        metaHash ?: string
    ) : Promise<SyncResult> {
        const token = await getAccessToken();

        if(!token){
            throw new Error('Not authenticated');
        }
        const url = `${SYNC_API_ENDPOINT}?since=${encodeURIComponent(since)}&type=${type ?? ''}&book=${book ?? ''}&meta_hash=${metaHash ?? ''}`;
        const res = await fetchWithTimeout(
            url,
            {
                headers : {
                    Authorization : `Bearer ${token}`
                },
            },
            8000,
        );
        if(!res.ok){
            const error = await res.json();
            throw new Error(`Failed to pull changes: ${error.error || res.statusText}`);
        }
        
        return res.json();
    }

    async pushChanges(payload : SyncData) : Promise<SyncResult>{
        const token = await getAccessToken();
        if(!token){
            throw new Error('Not authenticated');
        }
        const res = await fetchWithTimeout(
            SYNC_API_ENDPOINT,
            {
                method : 'POST',
                headers : {
                    'Content-Type' : 'application/json',
                    Authorization : `Bearer ${token}`,
                },
                body : JSON.stringify(payload),
            },
            8000
        );
        if(!res.ok){
            const error = await res.json();
            throw new Error(`Failed to push changes: ${error.error || res.statusText}`);
        }
        return res.json();
    }
}

export type SyncOp = 'push' | 'pull' | 'both';