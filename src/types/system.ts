import { Book } from "./book"

export type BaseDir = 'Books'| 'Settings' | 'Data' | 'Fonts' | 'Images' | 'Log' | 'Cache' | 'Temp' | 'None';
export type OSPlatform = 'android' | 'ios' | 'macos' | 'windows' | 'linux' | 'unknown';
export type AppPlatform = 'web' | 'tauri';

export type ResolvedPath = {
    baseDir : number;
    basePrefix : () => string;
    fp : string;
    base : BaseDir;
}
export interface FileSystem{
    resolvePath(path : string, base : BaseDir) : ResolvedPath;
    getURL(path : string) : string;
    openFile(path : string, base : BaseDir, filename ?: string) : Promise<File>;
    getPrefix(base : BaseDir) : Promise<string>;
    readFile(path : string,base : BaseDir,mode : 'text' | 'binary') : Promise<string | ArrayBuffer>;
}
export interface AppService{
    isMobile : boolean;
    
    importBook(
        file : string | File,
        book : Book[],
        savebook ?: boolean,
        savecover ?: boolean,
        overwrite ?: boolean,
        transient ?: boolean,
    ) : Promise<Book|null>;
    saveLibraryBook(book: Book[]): Promise<void>

}