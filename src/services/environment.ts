import { AppService } from "../types/system";
import { READEST_WEB_BASE_URL } from "./constants";

export interface EnvConfigType{
    getAppService : () => Promise<AppService>,
}

export  const isWebAppPlatform = () => process.env['NEXT_PUBLIC_APP_PLATFORM'] === 'web';
export const getBaseUrl = () => process.env['NEXT_PUBLIC_API_BASE_URL'] ?? READEST_WEB_BASE_URL;

const isWebDevMode = () => process.env['NODE_ENV'] === 'development' && isWebAppPlatform();

export const getAPIBaseUrl = () => (isWebDevMode() ? '/api' : `${getBaseUrl()}/api`);
