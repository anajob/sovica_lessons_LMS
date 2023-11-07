import { lazy } from "react";
import { ClientOnly, useHydrated } from "remix-utils";
const Editor = lazy(() => import("~/components/Editor"));
export default function LazyEditor(props: {
  name: string;
  defaultValue: string;
}) {
  return (
    <ClientOnly fallback={<p>Loading...</p>}>
      {() => <Editor defaultValue={props.defaultValue} name={props.name} />}
    </ClientOnly>
  );
}
