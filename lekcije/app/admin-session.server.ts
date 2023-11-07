import { adminUser } from "@prisma/client";
import { createCookieSessionStorage, Response } from "@remix-run/node";
import { redirect } from "react-router";

const sessionSecret = process.env.SESSION_SECRET;
if (typeof sessionSecret !== "string") {
  throw new Error("SESSION_SECRET must be set in .env file");
}

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
  },
});

export async function getAuthenticatedUserId(
  request: Request
): Promise<number | null> {
  const cookie = request.headers.get("Cookie");
  const session = await sessionStorage.getSession(cookie);
  const userId = session.get("userId");
  return userId ? userId : null;
}

export async function isAuthenticated(request: Request): Promise<boolean> {
  return !!(await getAuthenticatedUserId(request));
}

export async function ensureAuthenticated(request: Request) {
  const authenticated: boolean = await isAuthenticated(request);
  if (!authenticated) {
    throw redirect("/admin/login");
  }
}
export async function authenticateAdminUser(
  request: Request,
  adminUser: adminUser
) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  session.set("userId", adminUser.id);
  const setCookie = await sessionStorage.commitSession(session);

  return redirect("/admin/lekcije", {
    headers: {
      "Set-Cookie": setCookie,
    },
  });
}
