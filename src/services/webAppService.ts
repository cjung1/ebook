import { resolve } from "@tauri-apps/api/path";
import { BaseDir, ResolvedPath } from "../types/system";
import { isValidURL } from "../utils/misc";
import { DATA_SUBDIR, LOCAL_BOOKS_SUBDIR, LOCAL_FONTS_SUBDIR, LOCAL_IMAGES_SUBDIR } from "./constants";
import { path } from "@tauri-apps/api";
import { RemoteFile } from "../utils/file";


const basePrefix = async () => '';
const resolvePath = (path : string,base : BaseDir) : ResolvedPath =>{
    switch(base){
        case 'Data':
            return {baseDir : 0,basePrefix,fp :`${DATA_SUBDIR}/${path}`,base};
        case 'Books':
            return {baseDir : 0,basePrefix,fp :`${LOCAL_BOOKS_SUBDIR}`,base};
        case 'Fonts':
            return {baseDir : 0,basePrefix,fp : `${LOCAL_FONTS_SUBDIR}`,base};
        case 'Images':
            return {baseDir : 0,basePrefix,fp : `${LOCAL_IMAGES_SUBDIR}`,base};
        case "None":
            return {baseDir : 0,basePrefix,fp : path,base};
        default :
            return {baseDir : 0,basePrefix,fp : `${base}/${path}`,base};
    }
};
const dbName = 'AppFileSystem';
const version = 1;
async function openIndexedDB () : Promise<IDBDatabase>{
    return new Promise((resolve,reject) => {
        const request = indexedDB.open(dbName,version);
        request.onupgradeneeded = () => {
            const db = request.result;
            if(!db.objectStoreNames.contains('files')){
                db.createObjectStore('file',{keyPath : 'path'});
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error); 
    });
}
export const indexedDBFileSystem : FileSystem = {
    resolvePath,
    async getPrefix(base : BaseDir){
        const {basePrefix,fp} = this.resolvePath('',base);
        const basePath = await basePrefix();
        const prefix = fp ? (basePath ? `${basePath}/${fp}` : fp) : basePath;
        return prefix.replace(/\/+$/,'');
    },
    getURL(path : string){
        if(isValidURL(path)){
            return path;
        }
        else{
            return URL.createObjectURL(new Blob([path]));
        }
    },
    async readFile(path : string,base : BaseDir,mode : 'text'|'binary'){
        const{fp} = this.resolvePath(path,base);
        const db = await openIndexedDB();
        return new Promise<string | ArrayBuffer>((resolve,reject) => {
            const transaction = db.transaction('files','readonly');
            const store = transaction.objectStore('files');
            const request = store.get(fp);

            request.onsuccess = async () => {
                if(request.result){
                    const content = request.result.content;
                    if(mode === 'text'){
                        resolve(content);
                    }
                    else{
                        if(content instanceof Blob){
                            const arrayBuffer = content.arrayBuffer();
                            resolve(arrayBuffer);
                        }
                        else if(content instanceof ArrayBuffer){
                            resolve(content);
                        }
                        else if(typeof content === 'string'){
                            resolve(new TextEncoder().encode(content).buffer as ArrayBuffer);
                        }
                        else{
                            reject(new Error('Unsupported content type in IndexedDB'));
                        }
                    }
                }
                else{
                reject(new Error(`File not found: ${fp}`));
                }
            };
            request.onerror = () => reject(request.error);
        });
    },
    async openFile(path : string,base : baseDir,filename ?: string){
        if(isValidURL(path)){
            return new RemoteFile(path,filename).open();
        }
        else{
            const content = await readFile(path,base,'binary');
            return new File([content],filename || path);
        }
    },
    async exists(path : string, base : BaseDir){
        const {fp} = this.resolvePath(path,base);
        const db = await openIndexedDB();

        return new Promise<boolean>((resolve,reject) => {
            const transaction = db.transaction('files','readonly');
            const store = transaction.objectStore('files');
            const request = store.get(fp);

            request.onsuccess = () => resolve(!!request.result);
            request.onerror = () => reject(request.error);
        });
    },
    async createDir(){
        
    },
    async writeFile(path : string, base : BaseDir, content : string | ArrayBuffer | File){
        const {fp} = this.resolvePath(path,base);
        const db = await openIndexedDB();

        if(content instanceof File){
            content = await content.arrayBuffer();
        }
        return new Promise<void>((resolve,reject) => {
            const transaction  = db.transaction('files','readwrite');
            const store = transaction.objectStore('files');
            store.put({path : fp,content});

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    },
    async copyFile(srcPath : string,dstPath : string,base : BaseDir){
        const {fp} = this.resolvePath(dstPath,base);
        const db = await openIndexedDB();

        return new Promise<void>((resolve,reject) => {
            const transaction = db.transaction('files','readwrite');
            const store = transaction.objectStore('files');
            const getRequest = store.get(srcPath);

            getRequest.onsuccess = () => {
                const data = getRequest.result;
                if(data){
                    store.put({path : fp,content : data.content});
                    resolve();
                }
                else{
                    reject(new Error(`File not found: ${srcPath}`));
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    } 


}