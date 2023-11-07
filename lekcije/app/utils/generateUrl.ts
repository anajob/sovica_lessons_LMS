import { useState } from "react";
import { adminUser } from "@prisma/client";

function useProfileImageHandling(editor: adminUser | null) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isRemoving, setRemoving] = useState(false);

  let previewImgUrl;
  if (isRemoving) {
    previewImgUrl = "/imgPlaceholder.png";
  } else if (fileUrl) {
    previewImgUrl = fileUrl;
  } else if (editor?.imgUrl) {
    previewImgUrl = editor.imgUrl;
  } else {
    previewImgUrl = "/imgPlaceholder.png";
  }

  function processImage(event: any) {
    setRemoving(false);
    const imageFile = event.target.files[0];
    const imageUrl = URL.createObjectURL(imageFile);
    setFileUrl(imageUrl);
  }

  function handleImgRemoving() {
    setRemoving(true);
  }

  return { previewImgUrl, processImage, handleImgRemoving };
}

// editor.imgUrl
// editor?.imgUrl
// editor === undefined || editor === null ? undefined : editor.imgUrl

export { useProfileImageHandling };
