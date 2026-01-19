type ObjectStoreType = 'r2' | 's3';

export const getStorageType = () : ObjectStoreType => {
    if(process.env['NEXT_PUBLIC_OBJECT_STORAGE_TYPE']){
        return process.env['NEXT_PUBLIC_OBJECT_STORAGE_TYPE'] as ObjectStoreType;
    }
    else{
        return 'r2';
    }
}