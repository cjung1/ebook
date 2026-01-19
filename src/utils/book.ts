import BookItem from "../app/library/component/BookItem";
import { EXTS } from "../libs/documents";
import { Book, BookConfig } from "../types/book";
import { code6392to6391, isValidLang, normalizedLangCode } from "./lang";
import { getUserLang, makeSafeFilename, makeSafeFileName } from "./misc";
import { getStorageType } from "./storage";



export interface LanguageMap{
    [key : string] : string;
}

export interface Contributor{
    name : LanguageMap;
}
const LASTNAME_AUTHOR_SORT_LANGS = ['ar', 'bo', 'de', 'en', 'es', 'fr', 'hi', 'it', 'nl', 'pl', 'pt', 'ru', 'th', 'tr', 'uk'];
const formatLanguageMap = (x : string | LanguageMap, defaultLang = false) : string => {
    const userLang = getUserLang();
    if(!x){
        return '';
    }
    if(typeof x === 'string'){
        return x;
    }
    const keys = Object.keys(x);
    return defaultLang ? x[keys[0]!]! : x[userLang] || x[keys[0]!]!;
}
export const formatAuthorName = (name : string,lastNameFirst : boolean) => {
    if(!name){
        return '';
    }
    const parts = name.split(' ');
    if(lastNameFirst && parts.length > 1){
        return `${parts[parts.length - 1]},${parts.slice(0, -1).join(' ')}`;
    }
    return name;
}
export const listFormater = (narrow = false, lang = '') => {
    lang = lang ? lang : getUserLang();
    if(narrow){
        return new Intl.ListFormat('en',{style : 'narrow',type : 'unit'});
    }
    else{
        return new Intl.ListFormat(lang,{style : 'long', type : 'conjunction'});
    }
}
export const getBookLangCode = (lang : string | string[] | undefined) => {
    try{
        const bookLang = typeof lang === 'string' ? lang : lang?.[0];
        return bookLang ? bookLang.split('-')[0]! : '';
    }
    catch{
        return '';
    }
}
export const formatTitle = (title : string | LanguageMap) => {
    return typeof title === 'string' ? title : formatLanguageMap(title);
}
export const getPrimaryLanguage = (lang : string | string[] | undefined) => {
    const primaryLang = Array.isArray(lang) ? lang[0] : lang;
    if(isValidLang(primaryLang)){
        const normalizedLang = normalizedLangCode(primaryLang);
        return code6392to6391(normalizedLang) || normalizedLang;
    }
    return 'en';
}
export const formatAuthors = (
    contributors : string | string[] | Contributor | Contributor[],
    bookLang ?: string,
    sortAs ?: boolean,
) => {
    const langCode = getBookLangCode(bookLang) || 'en';
    const lastNameFirst = !!sortAs  && LASTNAME_AUTHOR_SORT_LANGS.includes(langCode);
    return Array.isArray(contributors) ?
    listFormater(langCode === 'zh',langCode).format(
        contributors.map((contributor) => 
        typeof contributor === 'string' ?
        formatAuthorName(contributor,lastNameFirst) :
        formatAuthorName(formatLanguageMap(contributor?.name),lastNameFirst)
        ),
    )
    : typeof contributors === 'string'?
    formatAuthorName(contributors,lastNameFirst) :
    formatAuthorName(formatLanguageMap(contributors.name),lastNameFirst)
}

export const getDir  = (book : Book) => {
   return `${book.hash}`; 
}

export const getLocalBookFilename = (book : Book) => {
    return `${book.hash}/${makeSafeFilename(book.sourceTitle || book.title)}.${EXTS[book.format]}`;
}
export const getCoverFilename = (book : Book) => {
    return `${book.hash}/cover.png`;
}
export const getConfigFilename = (book : Book) => {
    return `${book.hash}/config.json`;
}

export const INIT_BOOK_CONFIG : BookConfig = {
    updatedAt : 0,
}

export const getRemoteBookFilename = (book : Book) => {
    if(getStorageType() === 'r2'){
        return `${book.hash}/${makeSafeFilename(book.sourceTitle || book.title)}.${EXTS[book.format]}`;
    }
    else if(getStorageType === 's3'){
        return `${book.hash}/${book.hash}.${EXTS[book.format]}`;
    }
    else{
        return '';
    }
}

export const getLibraryFilename = () => {
    return 'library.json';
}

export const getLibraryBackupFilename = () => {
    return 'library_backup.json';
}