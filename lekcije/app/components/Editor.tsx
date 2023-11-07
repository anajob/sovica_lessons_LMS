import { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function Editor(props: { name: string; defaultValue: string }) {
  const [value, setValue] = useState(props.defaultValue);

  return (
    <>
      <input type="hidden" value={value} name={props.name} />
      <ReactQuill
        theme="snow"
        defaultValue={props.defaultValue}
        onChange={(changedValue) => setValue(changedValue)}
      />
    </>
  );
}
