import { franc } from "franc-min";
import { iso6392 } from "iso-639-2";
import { iso6393To1 } from "iso-639-3";
const commonIndivtoMarco : Record<string,string> = {
  cmn: 'zho',
  arb: 'ara',
  arz: 'ara',
  ind: 'msa',
  zsm: 'msa',
  nob: 'nor',
  nno: 'nor',
  pes: 'fas',
  quy: 'que',
};

export function code6393to6391(code : string) : string {
  const marco = commonIndivtoMarco[code] || code;
    return iso6393To1[marco] || '';
}
export function detectLanguage(content : string) : string{
    try{
        const iso6393Lang = franc(content.substring(0,1000));
        const iso6391Lang = code6393to6391(iso6393Lang) || 'en';
        return iso6391Lang;
    }
    catch{
        console.warn('Language detection failed, defaulting to en.');
        return 'en';
    }

}
export const normalizedLangCode = (lang : string | null | undefined) : string => {
  if(!lang){
    return '';
  }  
  return lang.split('-')[0]!.toLowerCase();
}

export const isValidLang = (lang ?: string) => {
  if(!lang){
    return false;
  }
  if(typeof lang !== 'string'){
    return false;
  }
  if(['und', 'mul', 'mis', 'zxx'].includes(lang)){
    return false;
  }
  const code = normalizedLangCode(lang);
  return iso6392.some((l) => l.iso6391 === code || l.iso6392B === code);
}
export const code6392to6391 = (code : string) : string => {
  const lang = iso6392.find((l) => l.iso6392B === code);
  return lang?.iso6391 || '';
}