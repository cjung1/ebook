import { Channel, invoke } from "@tauri-apps/api/core";


export type UploadMethod = 'POST' | 'PUT';


export interface ProgressPayload{
    progress : number;
    total : number;
    transferSpeed : number;
}

export type ProgressHandler = (progress : ProgressPayload) => void;

export const webUpload = (file : File,uploadUrl : string,onProgress ?: ProgressHandler) => {
    return new Promise<void>((resolve,reject) => {
        const startTime = Date.now();
        const xhr = new XMLHttpRequest();
        xhr.open('PUT',uploadUrl,true);

        xhr.upload.onprogress = (event) => {
            if(onProgress && event.lengthComputable){
                onProgress({
                    progress : event.loaded,
                    total : event.total,
                    transferSpeed : event.loaded / ((Date.now() - startTime) / 1000),
                });
            }
        };
         xhr.onload = () => {
            if(xhr.status >= 200 && xhr.status < 300){
                resolve();
            }
            else{
                reject(new Error(`Upload failed with status ${xhr.status}`));
            }
         };

         xhr.onerror = () => reject(new Error('Upload failed'));

         xhr.send(file);
    });
}


export const tauriUpload = async (
    url : string,
    filePath : string,
    method : UploadMethod,
    progressHandler ?: ProgressHandler,
    headers ?: Map<string,string>
) : Promise<string> => {
    const ids = new Uint32Array(1);
    window.crypto.getRandomValues(ids);
    const id = ids[0];

    const onProgress = new Channel<ProgressPayload>();
    if(progressHandler){
        onProgress.onmessage = progressHandler;
    }

    return await invoke('upload_file',{
        id,
        url,
        filePath,
        method,
        headers : headers ?? {},
        onProgress
    });
}

