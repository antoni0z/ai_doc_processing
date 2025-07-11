import { Outlet, Links, Meta, Scripts } from "@remix-run/react";
import "./styles/tailwind.css";

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <link rel="icon" href="data:image/x-icon;base64,AA" />
        <title>Doc Processing MVP</title>
        <Links />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
