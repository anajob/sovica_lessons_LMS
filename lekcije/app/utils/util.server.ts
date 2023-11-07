// utils/util.server.js

import cloudinary, { UploadApiResponse } from "cloudinary";
import { writeAsyncIterableToWritable } from "@remix-run/node";

cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

function uploadImageToCloudinary(data: any) {
  const uploadPromise = new Promise<cloudinary.UploadApiResponse>(
    async (resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        { folder: "remixImages" },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(result as UploadApiResponse);
        }
      );
      await writeAsyncIterableToWritable(data, uploadStream);
    }
  );
  return uploadPromise;
}

// const deleteImageFromCloudinary = async (public_id: any) => {
//   cloudinary.v2.uploader
//     .destroy(public_id, function (error: any, result: any) {
//       console.log(result, error);
//     })
//     .then((resp) => console.log(resp))
//     .catch((_err) =>
//       console.log("Something went wrong, please try again later.")
//     );
// };

export { uploadImageToCloudinary };
