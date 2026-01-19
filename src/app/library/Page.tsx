import { Suspense, useState } from "react";
import {ReadonlyURLSearchParams,useSearchParams} from "next/navigation";

import { useAuth } from "../../context/AuthContext";
import {useLibraryStore} from "../../store/libraryStore";
import {useSettingsStore} from "../../store/settingStore";
import { SelectedFile } from "../../hooks/useFileSelector";
const LibraryPageWithSearchParams = () => {
    const searchParams = useSearchParams();
    return <LibraryPageContent searchParams = {searchParams}/>;
};

const LibraryPageContent = ({searchParams} : {searchParams : ReadonlyURLSearchParams|null}) => {
    const {token,user} = useAuth();
    const{
        library : libraryBooks,
        updateBook,
    } = useLibraryStore();

    const [booksTransferProgress,setBooksTransferProgress] = useState<{
        [key : string] : number | null
    }>({});
};  
    const [loading,setLoading] = useState(false);
    const {settings} = useSettingsStore();
    const imortBook = (files : SelectedFile) =>{
        
    }








const LibraryPage = () => {
    return (
    <Suspense fallback={<div className="h-[100vh]"/>}>
        <LibraryPageWithSearchParams>
    </Suspense>
    );
};

export LibraryPage;