// // utils/cropImage.js
// export default function getCroppedImg(imageSrc, pixelCrop) {
//   return new Promise((resolve, reject) => {
//     const image = new Image();
//     image.crossOrigin = "anonymous";
//     image.src = imageSrc;

//     image.onload = () => {
//       const canvas = document.createElement("canvas");
//       canvas.width = pixelCrop.width;
//       canvas.height = pixelCrop.height;
//       const ctx = canvas.getContext("2d");

//       ctx.drawImage(
//         image,
//         pixelCrop.x,
//         pixelCrop.y,
//         pixelCrop.width,
//         pixelCrop.height,
//         0,
//         0,
//         pixelCrop.width,
//         pixelCrop.height
//       );

//       //  Ensure it creates a JPEG image (backend expects jpg/jpeg/png only)
//       canvas.toBlob(
//         (blob) => {
//           if (!blob) return reject(new Error("Canvas is empty"));
//           const file = new File([blob], "cropped.jpeg", { type: "image/jpeg" });
//           resolve(file); // Pass a File object with correct type and name
//         },
//         "image/jpeg",
//         1
//       );
//     };

//     image.onerror = (error) => reject(error);
//   });
// }
