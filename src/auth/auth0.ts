import { Auth0Client } from "@auth0/nextjs-auth0/server";

const appBaseUrl = process.env.APP_BASE_URL;
const normalizedAppBaseUrl = appBaseUrl ? new URL(appBaseUrl).origin : undefined;
const appBaseHost = normalizedAppBaseUrl ? new URL(normalizedAppBaseUrl).hostname : undefined;

export const auth0 = new Auth0Client({
	appBaseUrl: normalizedAppBaseUrl,
	logoutStrategy: "v2",
	transactionCookie: {
		domain: appBaseHost?.endsWith(".openaux.net") ? ".openaux.net" : undefined,
	},
});