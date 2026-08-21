import { NextResponse } from "next/server";
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
	async onCallback(error, context) {
		const baseUrl = context.appBaseUrl ?? process.env.APP_BASE_URL;

		if (error) {
			// SdkError wraps the OAuth error as `cause: { code, message }` — see
			// AuthorizationCodeGrantError in @auth0/nextjs-auth0.
			const cause = (error as { cause?: { code?: string; message?: string } }).cause;
			if (cause?.message === "email_not_verified") {
				return NextResponse.redirect(new URL("/verify-email", baseUrl));
			}

			return NextResponse.redirect(
				new URL(`/auth-error?message=${encodeURIComponent(error.message)}`, baseUrl),
			);
		}

		return NextResponse.redirect(new URL(context.returnTo || "/", baseUrl));
	},
});