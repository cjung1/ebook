import { create } from "zustand";
import { BookDoc } from "../libs/documents";
import { Book, BookConfig } from "../types/book";

interface BookData{
    id : string;
    book : Book | null;
    file : File | null;
    config : BookConfig | null;
    bookDoc : BookDoc | null;
    isFixedLayout : boolean;
}

interface BookDataState {
    booksData : {[id : string] : BookData};
    setConfig : (key : string, partialConfig : Partial<BookConfig>) => void;
}

export const useBookDataStore = create<BookDataState>((set) => ({
    booksData : {},

    setConfig : (key : string,partialConfig : Partial<BookConfig>) => {
        set((state : BookDataState) => {
            const id = key.split('-')[0]!;
            const config = (state.booksData[id]?.config || null) as BookConfig;
            if(!config){
                console.warn('No config found for book', id);
                return state;
            }
            Object.assign(config,partialConfig);
            return{
                booksData : {
                    ...state.booksData,
                    [id] : {
                        ...state.booksData[id]!,
                        config,
                    },
                }
            };
        });
    }
}))