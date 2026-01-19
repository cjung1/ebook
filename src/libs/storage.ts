import { getAPIBaseUrl, isWebAppPlatform } from "../services/environment";
import { fetchWithAuth } from "../utils/fetch";
import { ProgressHandler, ProgressPayload, tauriUpload, webUpload } from "../utils/transfer";


const API_ENDPOINTS = {
    upload : getAPIBaseUrl() + '/storage/upload',
    download : getAPIBaseUrl() + '/storage/download',
    delete : getAPIBaseUrl() + '/storage/delete',
}
export const createProgressHandler = (
    totalFiles : number,
    completedFilesRef : {count : number},
    onProgress ?: ProgressHandler,
) => {
    return (progress : ProgressPayload) => {
        const fileProgress = progress.progress / progress.total;
        const overallProgress = ((completedFilesRef.count + fileProgress) / totalFiles) * 100;
        if(onProgress){
            onProgress({
                progress : overallProgress,
                total : 100,
                transferSpeed : progress.transferSpeed,
            });
        }
    };
};


export const uploadFile = async (
    file : File,
    fileFullPath : string,
    onProgress ?: ProgressHandler,
    bookHash ?: string,
) => {
    try{
        const response = await fetchWithAuth(API_ENDPOINTS.upload,{
            method : 'POST',
            headers : {
                'Content-Type' : 'application/json'
            },
            body : JSON.stringify({
                fileName : file.name,
                fileSize : file.size,
                bookHash,
            }),
        });
        const {uploadUrl} = await response.json();
        if(isWebAppPlatform()){
            await webUpload(file,uploadUrl,onProgress);
        }
        else{
            await tauriUpload(uploadUrl,fileFullPath,'PUT',onProgress);
        }
    }
    catch(error){
        console.error('File upload failed:',error);
        if(error instanceof Error){
            throw error;
        }
        throw new Error('File upload failed');
    }
}
