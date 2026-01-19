export type BookFormat = 'EPUB' | 'MOBI' | 'PDF' | 'AZW' | 'AZW3' | 'CBZ' | 'FB2' | 'FBZ';

export interface Book{
    url ?: string;
    title : string 
    createAt : number

}


export interface BookConfig{
    bookHash ?: string;
    metaHash ?: string;

}

export interface ViewSettings extends
    BookLayout,
    BookStyle
    {}

export interface BookLayout {
    marginTopPx : number;
    marginBottomPx : number;
}

export interface BookStyle{
    zoomLevel : number;
    paragraphMargin : number;
}

export interface BookSearchConfig{
    scope : 'book' | 'section';
    matchCase : boolean;
}

export const FIXED_LAYOUT_FORMATS : Set<BookFormat> = new Set(['PDF','CBZ']);

export interface BookNote {
    bookHash ?: string,
    metaHash ?: string,
    id : string,
}

export interface BookDataRecord{
    id: string,
    book_hash : string,
    meta_hash ?: string,
}