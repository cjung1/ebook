import { useRouter } from "next/navigation";


export const navigateToLogin = (router : ReturnType<typeof useRouter>) => {
    const pathname = window.location.pathname;
    const search = window.location.search;
    const currentPath = pathname !== '/auth' ? pathname + search : '/';
    router.push(`/auth?redirect=${encodeURIComponent(currentPath)}`);
}