import { useState } from "react";
import { read, utils } from "xlsx";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { BaseDirectory, readDir } from "@tauri-apps/api/fs";
import { convertFileSrc } from "@tauri-apps/api/tauri";

function handleDownload() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const image = canvas.toDataURL();
  const aDownloadLink = document.createElement("a");
  aDownloadLink.download = "canvas_image.png";
  aDownloadLink.href = image;
  aDownloadLink.click();
}

export default function App() {
  const [ancho, setAncho] = useState(3780);
  const [alto, setAlto] = useState(3780);
  const [padding, setPadding] = useState(37.8);
  const [file, setFile] = useState<File>();
  const [images, setImages] = useState([]);
  console.log(images);

  const pixelXCm = 37.8;

  async function handleClear() {
    const canvas: HTMLCanvasElement = document.getElementById(
      "canvas"
    ) as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    //@ts-ignore
    ctx.clearRect(0, 0, ancho, alto);
  }

  async function handleGenerate(event: { preventDefault: () => void }) {
    event.preventDefault();
    // console.log(images);

    //SI CARGA ARCHIVO DE PEDIDO
    if (file) {
      //GET CANVAS
      const canvas: HTMLCanvasElement = document.getElementById(
        "canvas"
      ) as HTMLCanvasElement;
      const ctx = canvas.getContext("2d");

      //READE EXCEL
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);
      fileReader.onload = (e) => {
        //@ts-ignore
        const bufferArray = e.target.result;
        const wb = read(bufferArray, {
          type: "buffer",
        });

        //CONVERT EXCEL TO JSON
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = utils.sheet_to_json(ws);

        //ALTO DE IMAGEN CALCULADO EN PIXELES
        const desiredHeight = 6 * pixelXCm; // 6 cm to pixels (assuming 1 cm = 37.8 pixels)

        let currentX = 20;
        let currentY = 0;

        data.forEach((d) => {
          //@ts-ignore
          let amount = d["Cantidad (- reembolso)"];
          for (let i = 0; i < amount; i++) {
            const img = new Image();

            // When the image is loaded, calculate dimensions and draw
            img.onload = function () {
              const scale = desiredHeight / img.height;
              const scaledWidth = img.width * scale;

              if (currentX + scaledWidth + 20 > canvas.width) {
                // Move to the next row if there's not enough space
                currentX = 20;
                currentY += desiredHeight + padding;
              }

              // Draw the scaled image
              //@ts-ignore
              ctx.drawImage(
                img,
                currentX,
                currentY,
                scaledWidth,
                desiredHeight
              );

              // Update the X position for the next image
              currentX += scaledWidth + padding;
            };

            // Set the source to trigger the onload event
            //@ts-ignore
            img.src = `/stickers/${d["Nombre del artículo"].toLowerCase()}.png`;


          }
        });
      };
    } else {
      alert("Seleccione un archivo de pedido");
    }
  }

  async function handleFolder() {
    const imgs = await readDir("images", {
      dir: BaseDirectory.Desktop,
      recursive: false,
    });
    imgs.forEach(async (entry) => {
      let ent = {
        nombre:entry.name,
        path: convertFileSrc(entry.path)
      }
      setImages(old => [...old,ent]); // convertFileSrc() used here
    });
  }

  return (
    <section className="bg-primary text-white">
      <div className="flex justify-around mx-auto items-center text-center max-w-screen-lg h-screen">
        <div>
          <div className={`w-[550px] h-[550px] scale-w-[${alto / ancho}]`}>
            <canvas
              id="canvas"
              width={ancho}
              height={alto}
              className="w-full h-full bg-blue-950"
            />
          </div>
          <Button
            className="border"
            onClick={() => {
              handleDownload();
            }}
          >
            Descargar Imagen
          </Button>
          <Button
            variant="destructive"
            className="border"
            onClick={() => {
              handleClear();
            }}
          >
            Limpiar canvas
          </Button>
        </div>
        <div className="flex flex-col items-center border h-[550px] w-[300px] self-center text-center">
          <form
            className="mt-8 w-1/2 flex flex-col gap-4"
            onSubmit={handleGenerate}
          >
            <label className="text-white" htmlFor="orden">
              Orden de compra
            </label>
            <Input
              type="file"
              id="orden"
              name="orden"
              className="bg-white"
              //@ts-ignore
              onChange={(event) => setFile(event.target.files[0])}
            />
            <label className="text-white" htmlFor="imageFolder">
              Carpeta De Imagenes
            </label>
            <input
              //@ts-ignore
              webkitdirectory=""
              type="file"
              id="imageFolder"
              name="imageFolder"
              onClick={() => handleFolder()}
            />
            <label className="text-white" htmlFor="ancho">
              Ancho de plantilla
            </label>
            <Input
              type="number"
              id="ancho"
              name="ancho"
              value={Math.round(ancho / pixelXCm)}
              placeholder="Ancho de plantilla"
              onChange={(event) =>
                setAncho(Number(event.target.value) * pixelXCm)
              }
            />
            <label className="text-white" htmlFor="alto">
              Altura de plantilla
            </label>
            <Input
              type="number"
              id="alto"
              name="alto"
              value={Math.round(alto / pixelXCm)}
              placeholder="Altura de plantilla"
              onChange={(event) =>
                setAlto(Number(event.target.value) * pixelXCm)
              }
            />
            <label className="text-white" htmlFor="margen">
              Margenes
            </label>
            <Input
              type="number"
              id="margen"
              name="margen"
              value={Math.round(padding / pixelXCm)}
              placeholder="Margenes"
              onChange={(event) =>
                setPadding(Number(event.target.value) * pixelXCm)
              }
            />
            <Button
              className="border-2 rounded-md p-2 shadow-[inset_3px_-3px_30px_rgba(0,0,0,0.6)] shadow-blue-700"
              type="submit"
            >
              Generar
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
