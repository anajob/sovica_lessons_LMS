import { useLoaderData } from "@remix-run/react";
import { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getLekcija } from "~/models/lekcija.server";

export const loader = async function ({ params }: LoaderArgs) {
  if (typeof params.id !== "string") {
    throw new Error("type of id is not string");
  }
  const lekcija = await getLekcija(parseFloat(params.id));
  if (lekcija === null) {
    throw new Error(`lekcija with ${params.id} does not exist`);
  }
  const title = lekcija.title;
  const videoLink = lekcija.videoLink;
  const content = lekcija.content;
  return json({ lekcija, content, title, videoLink });
};

export default function previewLekcije() {
  const { content, title, videoLink } = useLoaderData<typeof loader>();
  return (
    <main>
      <div>
        <h1>{title}</h1>
        <div>{videoLink}</div>
        <div>{content}</div>
      </div>
    </main>
  );
}
