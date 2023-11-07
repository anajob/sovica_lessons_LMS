import { ActionArgs } from "@remix-run/server-runtime";
import { redirect } from "react-router";
import { sessionStorage } from "~/admin-session.server";

export async function action({ request }: ActionArgs) {
  const cookie = request.headers.get("Cookie");
  const session = await sessionStorage.getSession(cookie);
  return redirect("/admin/login", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
