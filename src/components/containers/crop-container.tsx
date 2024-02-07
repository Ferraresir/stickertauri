//@ts-ignore
import { useEffect, useState } from "react";
//@ts-ignore
import { readDir, writeFile } from "@tauri-apps/api/fs";
import { convertFileSrc } from "@tauri-apps/api/tauri";

// async function test() {
//   // giving more info about the background doesn't make a difference :(
//   // const { info, data } = await sharp("./input.png").trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 }).png().toBuffer({ resolveWithObject: true });
//   const testFolder = "./images";

//   fs.readdirSync(testFolder).forEach(async (file) => {
//     const { info, data } = await sharp(`./images/${file}`)
//       .trim({ threshold: 10 })
//       .png()
//       .toBuffer({ resolveWithObject: true });
//     console.log(info);
//     await writeFile(`./images/${file}`, data);
//   });
// }

// test();

export default function CropContainer() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    setImages([]);
    //CARGA LAS IMAGENES DEL DIRECTORIO
    readDir("C:\\tiendaimages\\cortar", {
      recursive: true,
    }).then((imgs) => {
      imgs.forEach((entry) => {
        entry.path = convertFileSrc(entry.path);
        //@ts-ignore
        setImages((old) => [...old, entry]);
      });
    });
  }, []);

  return (
    <div className="w-full h-full flex flex-col gap-6 justify-center items-center">
      {/* @ts-ignore */}
      {images ? images.map((i) => <img src={i.path} />) : <p>No image</p>}
    </div>
  );
}
