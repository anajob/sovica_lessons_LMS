import type { ActionArgs, LinksFunction, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

// import tailwindStylesheetUrl from "./styles/tailwind.css";
import bootstrapStyles from "bootstrap/dist/css/bootstrap.css";
import customBootstrapStylesheetUrl from "./styles/customBootstrap.css";
import { getUser } from "./session.server";
import fontAwsome from "@fortawesome/fontawesome-free/css/all.min.css";
import quill from "react-quill/dist/quill.snow.css";
export const links: LinksFunction = () => {
  return [
    // { rel: "stylesheet", href: tailwindStylesheetUrl }
    { rel: "stylesheet", href: bootstrapStyles },
    { rel: "stylesheet", href: customBootstrapStylesheetUrl },
    { rel: "stylesheet", href: customBootstrapStylesheetUrl },
    { rel: "stylesheet", href: fontAwsome },
    { rel: "stylesheet", href: quill },
  ];
};

// export async function loader({ request }: LoaderArgs) {
//   return json({
//     user: await getUser(request),
//   });
// }

export default function App() {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
