import { json } from "@remix-run/server-runtime";
import { Link, useLoaderData } from "@remix-run/react";

import { getLekcije } from "~/models/lekcija.server";
import { prisma } from "~/db.server";

export const loader = async function () {
  return json({
    lekcije: await getLekcije(),
  });
};

export default function Lekcije() {
  const dataFromJson = useLoaderData<typeof loader>();
  const lekcije = dataFromJson.lekcije;
  return (
    <main>
      <div>
        <h1 className="fs-1 text-danger">Lekcije</h1>
        <div>
          <ul>
            {lekcije.map(function (lekcija) {
              return (
                <li key={lekcija.id}>
                  <Link to={lekcija.id.toString()}>{lekcija.title}</Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </main>
  );
}
