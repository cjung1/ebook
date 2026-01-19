import {create} from 'zustand';
import { Book } from '../types/book';
import {EnvConfigType} from '../services/environment';

interface LibraryState{
    library : Book[];
    groups : Record<string,string>;
    updateBook : (envConfig : EnvConfigType,book : Book) => void;
    getGroupName : (id : string) => string | undefined;
}

export const useLibraryStore = create<LibraryState>((set,get) => ({
    library : [],
    groups : {},
    updateBook : async (envConfig : EnvConfigType,book : Book) => {
        const AppService = await envConfig.getAppService();
        const {library} = get();
        const BookIndex = library.findIndex((b) => b.hash === book.hash);
        if(BookIndex !== -1){
            library[BookIndex] = book;
        }
        set({library : [...library]});
        await AppService.saveLibraryBook(library);
    },
    getGroupName : (id : string) => {
        return get().groups[id];
    }
}))