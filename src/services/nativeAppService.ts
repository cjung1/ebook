
import { appCacheDir, appConfigDir, appDataDir, appLogDir, BaseDirectory, basename, join, tempDir } from "@tauri-apps/api/path";
import { BaseDir, FileSystem } from "../types/system"
import { DATA_SUBDIR, LOCAL_BOOKS_SUBDIR, LOCAL_FONTS_SUBDIR, LOCAL_IMAGES_SUBDIR } from "./constants";
import { getDirPath, getFilename } from "../utils/path";
import { isContentURI, isValidURL } from "../utils/misc";
import { NativeFile, RemoteFile } from "../utils/file";
import { copyURIToPath } from "../utils/bridge";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getDir } from "../utils/book";

const getPathResolver = ({
    customRootDir,
    isPortable,
    execDir,
} : {
    customRootDir ?: string;
    isPortable ?: boolean;
    execDir ?: string;
} = {}) => {
    const customBaseDir = customRootDir ? 0 : undefined;
    const isCustomBaseDir = Boolean(customRootDir);
    const getCustomBasePrefixSync = isCustomBaseDir ?
    (baseDir : BaseDir) => {
        return () => {
            const leafDir = ['Settings','Data','Books','Fonts'].includes(baseDir) ? '' : baseDir;
            return leafDir ? `${customRootDir}/${leafDir}` : `${customRootDir}`
        };
    } : undefined;
    const getCustomBasePrefix = getCustomBasePrefixSync ?
    (baseDir : BaseDir) => async() =>getCustomBasePrefixSync(baseDir)() 
    : undefined;
    return (path : string,base : BaseDir) =>{
        const customBasePrefixSync = getCustomBasePrefixSync?.(base);
        const customBasePrefix = getCustomBasePrefix?.(base);
        switch(base){
            case 'Settings' :
                return{
                    baseDir : isPortable ? 0 : BaseDirectory.AppConfig,
                    basePrefix : isPortable && execDir ? async() => execDir : appConfigDir,
                    fp : isPortable && execDir ? `${execDir}${path ? `/${path}` : ''}` : path,
                    base,
                };
            case 'Cache' :
                return{
                    baseDir : BaseDirectory.AppCache,
                    basePrefix : appCacheDir,
                    fp : path,
                    base,
                };
            case 'Log' :
                return{
                    baseDir : isCustomBaseDir ? 0 : BaseDirectory.AppLog,
                    basePrefix : customBasePrefix ?? appLogDir,
                    fp : customBasePrefixSync ? `${customBasePrefixSync()}${path ? `/${path}` : ''}` : path,
                    base,
                };
            case 'Data' :
                return{
                    baseDir : customBaseDir ?? BaseDirectory.AppData,
                    basePrefix : customBasePrefix ?? appDataDir,
                    fp : customBasePrefixSync ?
                    `${customBasePrefixSync()}/${DATA_SUBDIR}${path ? `/${path}` : ''}`
                    :`${DATA_SUBDIR}${path ? `/${path}` : ''}`,
                    base,
                };
            case 'Books':
                return{
                    baseDir : customBaseDir ?? BaseDirectory.AppData,
                    basePrefix : customBasePrefix || appDataDir,
                    fp : customBasePrefixSync ?
                    `${customBasePrefixSync()}/${LOCAL_BOOKS_SUBDIR}${path ? `/${path}` : ''}`
                    : `${LOCAL_BOOKS_SUBDIR}${path ? `/${path}` : ''}`,
                    base,
                };
            case 'Fonts':
                return{
                    baseDir : customBaseDir || BaseDirectory.AppData,
                    basePrefix : customBasePrefix || appDataDir,
                    fp : customBasePrefixSync ?
                    `${customBasePrefixSync()}/${LOCAL_FONTS_SUBDIR}${path ? `/${path}` : ''}`
                    :`${LOCAL_FONTS_SUBDIR}${path ? `/${path}` : ''}`,
                    base,
                };
            case 'Images' :
                return{
                    baseDir : customBaseDir || BaseDirectory.AppData,
                    basePrefix : customBasePrefix || appDataDir,
                    fp : customBasePrefixSync ?
                    `${customBasePrefixSync()}/${LOCAL_IMAGES_SUBDIR}${path ? `/${path}` : ''}`
                    :`${LOCAL_IMAGES_SUBDIR}${path ? `/${path}` : ''}`,
                    base,
                };
            case 'None' :
                return{
                    baseDir : 0,
                    basePrefix : async() => '',
                    fp : path,
                    base,
                };
            case 'Temp' :
                return{
                    baseDir : BaseDirectory.Temp,
                    basePrefix : tempDir,
                    fp : path,
                    base,
                };
    }
};
const OS_TYPE = osType();
};
export const nativeFileSystem : FileSystem = {
    resolvePath : getPathResolver(),
    async getBasePrefix(base : BaseDir){
        const {basePrefix,fp,baseDir} = resolvePath('',base);
        let basePath = basePrefix();
        basePath = basePath.replace(/\/+$/,'');
        return fp ? (baseDir === 0 ? fp : await (join(basePath,fp))) : basePath;
    },
    async openFile(path : string, base : BaseDir, name ?: string){
        const {fp,baseDir} = this.resolvePath(path,base);
        let fname = name || getFilename(fp);
        if(isValidURL(path)){
            return await new RemoteFile(path,fname).open();
        }
        else if(isContentURI(path)){
            fname = await basename(path);
            if(path.includes('com.android.externalstorage')){
                return await new NativeFile(fp,fname,baseDir ? baseDir : null).open();
            }
            else{
                const prefix = await this.getPrefix('Cache');
                const dst = await join(prefix,fname);
                const res = await copyURIToPath({uri : path,dst});
                if(!res.success){
                    console.log('Failed to open file :',res);
                    throw new Error('Failed to open file');
                }
                return await new NativeFile(dst,fname,baseDir ? baseDir : null).open();

            }
        }
        else{
            const prefix = await this.getPrefix(base);
            const absolutePath = path.startsWith('/') ? path : prefix ? await join(prefix,path) : null;
            if(absolutePath && OS_TYPE !== 'android'){
                return await new RemoteFile(this.getURL(absolutePath),fname).open();
            }
            else {
                return await new NativeFile(fp,fname,baseDir ? baseDir : null).open();
            }
        }
    },
    getURL(path : string){
        return isValidURL(path) ? path : convertFileSrc(path);
    },
    async readFile(path : string,base : BaseDir,mode : 'text' | 'binary'){
        const {fp,baseDir} = this.resolvePath(path,base);
        if(mode === 'text'){
            return readTextFile(fp,baseDir ? baseDir : undefined) as Promise<string>;
        }
        else{
            return await readFile(fp,baseDir ? baseDir : undefined).buffer as ArrayBuffer;
        }

    },
    async exists(path : string,base : BaseDir) {
        const {fp, baseDir} = this.resolvePath(path,base);
        
        try{
            const res = await exists(fp,baseDir ? {baseDir} : undefined);
            return res;
        }
        catch{
            return false
        }
    },
    async createDir (path : string,base : BaseDir,recursive = false){
        const {fp, baseDir} = this.resolvePath(path,base);
        await mkdir(fp, {baseDir ? baseDir : undefined, recursive});
    },
    async writeFile(path : string, base : BaseDir, content : string | ArrayBuffer | File){
        const {fp,baseDir} = this.resolvePath(path,base);
        if(!(await this.exists(getDir(path),base))){
            await this.createDir(getDir(path),base,true);
        }    
        if(typeof content === 'string'){
            return writeTextFile(fp,content,baseDir ? {baseDir} : undefined);
        }
        else if(content instanceof File){
            const writeOptions = {
                write : true,
                create : true,
                baseDir : baseDir ? baseDir : undefined,
            } as WriteFileOptions;
            return await writeFile(fp,content.stream(),writeOptions);
        }
        else{
            return await writeFile(fp,new Uint8Array(content),baseDir ? {baseDir} : undefined);
        }
    },
    async copyFile(srcPath : string,dstPath : string, base : BaseDir){
        if(!(await this.exists(getDirPath(dstPath),base))){
            await this.createDir(getDirPath(dstPath),base,true);
        }
        if(isContentURI(srcPath)){
            const prefix = await this.getPrefix(base);
            if(!prefix){
                throw new Error('Invalid base directory');
            }
            const res = await copyURIToPath({
                uri : srcPath,
                dst : await join(prefix,dstPath),
            });
            if(!res.success){
                console.error('Failed to copy file:',res);
                throw new Error('Failed to copy file');
            }
        }
        else{
            const {fp,baseDir} = this.resolvePath(dstPath,base);
            await copyFile(srcPath,fp,baseDir ? {toPathBaseDir : baseDir} : undefined);
        }
    },
    
}