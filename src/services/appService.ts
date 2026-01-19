import { BookDoc, DocumentLoader } from "../libs/documents";
import { createProgressHandler, uploadFile } from "../libs/storage";
import { Book, BookConfig, BookFormat, FIXED_LAYOUT_FORMATS } from "../types/book";
import { SystemSettings } from "../types/settings";
import { AppPlatform, AppService, FileSystem } from "../types/system";
import { formatAuthors, formatTitle, getConfigFilename, getCoverFilename, getDir, getLibraryBackupFilename, getLibraryFilename, getLocalBookFilename, getPrimaryLanguage, getRemoteBookFilename, INIT_BOOK_CONFIG } from "../utils/book";
import { ClosableFile } from "../utils/file";
import { partialMD5 } from "../utils/md5";
import { isContentURI, isValidURL } from "../utils/misc";
import { getBaseFilename, getFilename } from "../utils/path";
import { serializeConfig } from "../utils/serializer";
import { ProgressHandler } from "../utils/transfer";
import { TxTToEpubConverter } from "../utils/txt";
import { CLOUD_BOOKS_SUBDIR, DEFAULT_BOOK_SEARCH_CONFIG, DEFAULT_FIXED_LAYOUT_VIEW_SETTINGS } from "./constants";

export abstract class BaseAppService implements AppService{

    isMobile = false;
    protected abstract fs : FileSystem;
    appPlatform : AppPlatform = 'tauri';
    localBooksDir = '';

    getCoverImageBlobURL = async (book : Book) : Promise<string> => {
        return this.fs.getBlobURL(`${this.localBooksDir}/${getCoverFilename(book)}`,'None');
    }
    getCoverImageURL = (book : Book) => {
        return this.fs.getURL(`${this.localBooksDir}/${getCoverFilename(book)}`);
    }
    async importBook = (
        file : string | File,
        books : Book[],
        saveBook : boolean = true,
        saveCover : boolean = true,
        overwrite : boolean = false,
        transient : boolean = false,
    ) : Promise<Book|null> {
        let loadedbook : BookDoc;
        let format : BookFormat;
        let filename : string;
        let fileobj : File;

        if(transient && typeof file !== 'string'){
            throw new Error ('Transient import is only supported for file paths');
        }
        try{
            if(typeof file === 'string'){
                fileobj = await this.fs.openFile(file,'None');
                filename = fileobj.name || getFilename(file);
            }
            else{
                fileobj = file;
                filename = file.name;
            }
            if(/\.txt$/i.test(filename)){
                const txt2epub = new TxTToEpubConverter();
                ({file : fileobj} = await txt2epub.convert({file : fileobj}));
            }
            ({book : loadedbook,format} = await new DocumentLoader(fileobj).open());
            const metadataTitle = formatTitle(loadedbook.metadata.title);
            if(!metadataTitle || !metadataTitle.trim() || metadataTitle === filename){
                loadedbook.metadata.title = getBaseFilename(filename);
            }
        }catch(error){
            console.error(error);
            throw new Error(`Failed to open the book : ${(error as Error).message || error}`);
        }

        const hash = await partialMD5(fileobj);
        const existingBook = books.filter((b) => b.hash === hash)[0];
        if(existingBook){
            if(!transient){
                existingBook.deletedAt = null;
            }
            existingBook.createAt = Date.now();
            existingBook.updatedAt = Date.now();
        }
        const primaryLanguage = getPrimaryLanguage(loadedbook.metadata.language);
        const book : Book = {
            hash,
            format,
            title : formatTitle(loadedbook.metadata.title),
            sourceTitle : formatTitle(loadedbook.metadata.title),
            primaryLanguage,
            author : formatAuthors(loadedbook.metadata.author,primaryLanguage),
            createAt : existingBook ? existingBook.createAt : Date.now(),
            uploadedAt : existingBook ? existingBook.uploadedAt : null,
            deletedAt : transient ? Date.now() : null,
            downloadedAt : Date.now(),
            updatedAt : Date.now(),
        }
        if(existingBook){
            existingBook.format = book.format;
            existingBook.title = existingBook.title.trim() ? existingBook.title.trim() : book.title;
            existingBook.sourceTitle = existingBook.sourceTitle ?? book.sourceTitle;
            existingBook.author = existingBook.author ?? book.author;
            existingBook.primaryLanguage = existingBook.primaryLanguage ?? book.primaryLanguage;
            existingBook.downloadedAt = Date.now();
        }

        if(!(await this.fs.exists(getDir(book),'Books'))){
            await this.fs.createDir(getDir(book),'Books');
        }
        if(saveBook 
            && transient
            && (!(await this.fs.exists(getLocalBookFilename(book),'Books') ) || overwrite)
        ){
            if(/\.txt$/.test(filename)){
                await this.fs.writeFile(getLocalBookFilename(book),'Books',fileobj);
            }
            else if(typeof file === 'string' && isContentURI(file)){
                await this.fs.copyFile(file,getLocalBookFilename(book),'Books');
            }
            else if(typeof file === 'string' && !isValidURL(file)){
                await this.fs.copyFile(file,getLocalBookFilename(book),'Books');
            }
            else{
                await this.fs.writeFile(getLocalBookFilename(book),'Books',fileobj);
            }
        }
        if(saveCover && (!(await this.fs.exists(getCoverFilename(book),'Books')) || overwrite)){
            const cover = await loadedbook.getCover();
            if(cover){
                await this.fs.writeFile(getCoverFilename(book),'Books',await cover.arrayBuffer);
            }    
        }
        if(!existingBook){
            await this.saveBookConfig(book,INIT_BOOK_CONFIG);
            books.splice(0,0,book);
        }
        if(typeof file === 'string'){
            if(isValidURL(file)){
                book.url = file;
                if(existingBook){
                    existingBook.url = file;
                }
            }
            if(transient){
                book.filePath = file;
                if(existingBook){
                    existingBook.filePath = file;
                }
            }
        }
        book.coverImageUrl = await this.generateCoverImageURL(book);
        const f = file as ClosableFile;
        if(f && f.close){
            await f.close();
        }
        return book;



    };
    async saveBookConfig(book : Book,config : BookConfig,settings ?: SystemSettings){
        let serializedConfig : string;
        if(settings){
            const globalViewSettings = {
                ...settings.globalViewSettings,
                ...(FIXED_LAYOUT_FORMATS.has(book.format) ? DEFAULT_FIXED_LAYOUT_VIEW_SETTINGS : {})
            };
            serializedConfig = serializeConfig(config,globalViewSettings,DEFAULT_BOOK_SEARCH_CONFIG);
        }
        else{
            serializedConfig = JSON.stringify(config);
        }
        await this.fs.writeFile(getConfigFilename(book),'Books',serializedConfig);
    }
    async generateCoverImageURL(book : Book) : Promise<string>{
        return this.appPlatform === 'web' ?
         await this.getCoverImageBlobURL(book) :
         this.getCoverImageURL(book);
    }
    
    async uploadFileToCloud(lfp : string,cfp : string,handleProgress : ProgressHandler,hash : string){
        console.log('Uploading file:',lfp,'to',cfp);
        const file = await this.fs.openFile(lfp,'Books',cfp);
        const localFullPath = `${this.localBooksDir}/${lfp}`;
        await uploadFile(file,localFullPath,handleProgress,hash);
        const f = file as ClosableFile;
        if(f && f.close){
            await f.close();
        }
    }
    
    async uploadBook(book : Book,onProgress ?: ProgressHandler) : Promise<void>{
        let uploaded = false;
        const completedFiles = {count : 0};

        let toUploadFpCount = 0;
        const coverExist = await this.fs.exists(getCoverFilename(book),'Books');
        let bookFileExist = await this.fs.exists(getLocalBookFilename(book),'Books');

        if(coverExist){
            toUploadFpCount ++;
        }
        if(bookFileExist){
            toUploadFpCount ++;
        }
        if(!bookFileExist && book.url){
            const fileobj = await this.fs.openFile(book.url,'None');
            await this.fs.writeFile(getLocalBookFilename(book),'Books',await fileobj.arrayBuffer());
            bookFileExist = true;
        }
        const handleProgress = createProgressHandler(toUploadFpCount,completedFiles,onProgress);
        if(coverExist){
            const lfp = getCoverFilename(book);
            const cfp = `${CLOUD_BOOKS_SUBDIR}/${getCoverFilename(book)}`;
            await this.uploadFileToCloud(lfp,cfp,handleProgress,book.hash);
            uploaded = true;
            completedFiles.count ++;
        }
        if(bookFileExist){
            const lfp = getLocalBookFilename(book);
            const cfp = `${CLOUD_BOOKS_SUBDIR}/${getRemoteBookFilename(book)}`;
            await this.uploadFileToCloud(lfp,cfp,handleProgress,book.hash);
            uploaded = true;
            completedFiles.count ++;
        }
        if(uploaded){
            book.deletedAt = null;
            book.updatedAt = Date.now();
            book.uploadedAt = Date.now();
            book.downloadedAt = Date.now();
            book.coverDownloadedAt = Date.now();
        }
        else{
            throw new Error('Book file not uploaded');
        }
    }

    async saveLibraryBooks(book : Book[]) : Promise<void> {
        const libraryBooks = book.map(({coverImageUrl,...rest}) => rest);
        const jsonData = JSON.stringify(libraryBooks,null,2);
        const libraryFilename = getLibraryFilename();
        const backupFilename = getLibraryBackupFilename();

        const saveResults = await Promise.allSettled([
            this.fs.writeFile(backupFilename,'Books',jsonData),
            this.fs.writeFile(libraryFilename,'Books',jsonData),
        ]);
        const backupSuccess = saveResults[0].status === 'fulfilled';
        const mainSuccess = saveResults[1].status === 'fulfilled';
        if(!backupSuccess || !mainSuccess){
            throw new Error('Failed to save library books');
        }
    }

}