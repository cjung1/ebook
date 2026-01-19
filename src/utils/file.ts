import { BaseDirectory } from "@tauri-apps/api/path";
import { getOSPlatform } from "./misc";


export interface ClosableFile extends File{
    open() : Promise<this>;
    close() : Promise<void>;
}
export class RemoteFile extends File implements ClosableFile{
    url : string;
    #size : number = -1;
    #type : string = '';
    #lastModified : number;
    #name : string;
    #cache : Map<number,ArrayBuffer> = new Map(); // LRU 
    #order : number[] = [];

    
    constructor(url : string,name ?: string,type = '',lastModified = Date.now()){
        const basename = url.split('/').pop() || 'remote-file';
        super([],name || basename,{type,lastModified});
        this.url = url;
        this.#name = name || basename;
        this.#type = type;
        this.#lastModified = lastModified; 
    };
    async open(){
        if(getOSPlatform() === 'android'){
            return this._open_with_range();
        }
        else{
            return this._open_with_head();
        }
    };
    async _open_with_range(){
        const response = fetch(this.url, {headers : {Range : `bytes=${0}-${1023}`}});
        if(!(await response).ok){
            throw new Error(`Failed to fetch file size : ${(await response).status}`);
        }
        this.#size = Number((await response).headers.get('content-range')?.split('/')[1]);
        this.#type = (await response).headers.get('content-type') || '';
        return this;
    }
    async _open_with_head(){
        const response = fetch(this.url,{method : 'HEAD'});
        if(!(await response).ok){
            throw new Error(`Failed to fetch file size : ${(await response).status}`);
        }
        this.#size = Number((await response).headers.get('content_length'));
        this.#type = (await response).headers.get('content-type') || '';
        return this;
    }

    async close(): Promise<void> {
        this.#cache.clear();
        this.#order = [];
    }
}
export class NativeFile extends File implements ClosableFile{
    #fp : string;
    #name : string;
    #baseDir : BaseDirectory | null = null;
    #handle : FileHandle | null;
    #lastModified : number = 0;
    #size : number = -1;
    #type : string = '';
    #cache : Map<number,ArrayBuffer> = new Map();
    #order : number[] = [];
    constructor(fp : string,name ?: string,baseDir : BaseDirectory | null = null,type = ''){
        super([],name || fp, {type});
        this.#fp = fp;
        this.#baseDir = baseDir;
        this.#name = name || fp;        
    }
    async open(){
        this.#handle = await open(#this.#fp,this.#baseDir ? {baseDir : this.#baseDir} : undefined);
        const stats = await this.#handle.stat();
        this.#size = stats.size;
        this.#lastModified = stats.mtime ? stats.mtime.getTime() : Date.now();
        return this;
    }
    async close(): Promise<void> {
        if(this.#handle){
            await this.#handle.close();
            this.#handle = null;
        }
        this.#cache.clear();
        this.#order = [];
    }

}