import { BookSearchConfig, ViewSettings } from "../types/book";

export const DATA_SUBDIR = 'Ebook1';
export const LOCAL_BOOKS_SUBDIR = `${DATA_SUBDIR}/Books`;
export const LOCAL_FONTS_SUBDIR = `${DATA_SUBDIR}/Fonts`;
export const LOCAL_IMAGES_SUBDIR = `${DATA_SUBDIR}/Images`;

export const DEFAULT_FIXED_LAYOUT_VIEW_SETTINGS : Partial<ViewSettings> = {
    overrideColor : true,
}

export const DEFAULT_BOOK_SEARCH_CONFIG : BookSearchConfig = {
    scope : 'book',
   matchCase : false,
   matchWholeWords : false,
   matchDiacritics : false, 
}

export const READEST_WEB_BASE_URL = 'https://web.readest.com';

export const CLOUD_BOOKS_SUBDIR = `${DATA_SUBDIR}/Books`;