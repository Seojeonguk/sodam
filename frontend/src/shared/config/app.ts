export const DEFAULT_PAGE_INDEX = 0;
export const DEFAULT_CATEGORY_PAGE_SIZE = 20;
export const CATEGORY_SELECTION_PAGE_SIZE = 100;

export const API_BASE_URL =
  import.meta.env.VITE_API_TRANSACTION_BASE_URL ?? "http://localhost:10003/api";

const AUTH_BASE_URL =
  import.meta.env.VITE_AUTH_BASE_URL ?? "https://junguk7880.site";

export const OAUTH_AUTHORIZATION_URLS = {
  kakao: `${AUTH_BASE_URL}/oauth2/authorization/kakao`,
  google: `${AUTH_BASE_URL}/oauth2/authorization/google`,
} as const;
