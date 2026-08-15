import { Auth0Client } from "@auth0/nextjs-auth0/server";

const appBaseUrl = process.env.APP_BASE_URL;
const appBaseHost = appBaseUrl ? new URL(appBaseUrl).hostname : undefined;

export const auth0 = new Auth0Client({
	transactionCookie: {
		domain: appBaseHost?.endsWith(".openaux.net") ? ".openaux.net" : undefined,
	},
});