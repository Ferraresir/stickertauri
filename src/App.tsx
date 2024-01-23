import { useEffect, useState } from "react";
import { read, utils } from "xlsx";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { BaseDirectory, readDir } from "@tauri-apps/api/fs";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { ModeToggle } from "./components/mode-toggle";
import { Slider } from "./components/ui/slider";
import { cn } from "./lib/utils";

//DOWNLOAD THE CANVAS IN PNG IMAGE
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
  const [images, setImages] = useState<{ nombre: string; path: string }[]>([]);

  //PIXELS POR CM
  const pixelXCm = 37.8;

  //CARGA LAS IMAGENES DESDE EL DIRECTORIO
  useEffect(() => {
    readDir("images", {
      dir: BaseDirectory.Desktop,
      recursive: false,
    }).then((imgs) => {
      imgs.forEach((entry) => {
        let ent = {
          nombre: entry.name || "",
          path: convertFileSrc(entry.path),
        };
        setImages((old) => [...old, ent]);
      });
    });
  }, []);

  //LIMPIA EL CANVAS
  async function handleClear() {
    const canvas: HTMLCanvasElement = document.getElementById(
      "canvas"
    ) as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    //@ts-ignore
    ctx.clearRect(0, 0, ancho, alto);
  }

  //GENERA EL CANVAS ACOMODODANDO LAS IMAGENES HORIZONTALMENTE HASTA Q NO HAY LUGAR Y BAJA VERTICALMENTE
  async function handleGenerate(event: { preventDefault: () => void }) {
    event.preventDefault();

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

        //START POINT IN CANVAS
        let currentX = 20;
        let currentY = 0;

        //LOGICA POR CADA IMAGEN
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

            // let im = images.find(
            //   (i) =>
            //     //@ts-ignore
            //     i.nombre === `${d["Nombre del artículo"].toLowerCase()}.png`
            // );
            // //@ts-ignore
            // img.src = im.path;
          }
        });
      };
    } else {
      alert("Seleccione un archivo de pedido");
    }
  }

  return (
    <section>
      <div className="absolute right-4 top-4">
        <ModeToggle />
      </div>
      <div className="flex justify-around mx-auto items-center text-center max-w-screen-lg h-screen">
        <div>
          <div className={`w-[500px] h-[500px]`}>
            <canvas
              id="canvas"
              width={ancho}
              height={alto}
              className="w-full h-full bg-blue-900"
            />
          </div>
          <Button
            className="border mt-2"
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
        <div className="flex flex-col items-center border h-3/4 w-[300px] self-center text-center">
          <form
            className="mt-8 w-1/2 flex flex-col gap-4"
            onSubmit={handleGenerate}
          >
            <label className="" htmlFor="orden">
              Orden de compra
            </label>
            <Input
              type="file"
              id="orden"
              name="orden"
              className="cursor-pointer file:dark:text-white"
              //@ts-ignore
              onChange={(event) => setFile(event.target.files[0])}
            />
            {/* <label className="" htmlFor="imageFolder">
              Carpeta De Imagenes
            </label>
            <input
              //@ts-ignore
              webkitdirectory=""
              type="file"
              id="imageFolder"
              name="imageFolder"
              onClick={() => handleFolder()}
            /> */}
            <label className="" htmlFor="ancho">
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
            <label className="" htmlFor="alto">
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
            <label className="" htmlFor="margen">
              {`Margenes: ${Math.round((padding / pixelXCm) * 100) / 100} Cm`}
            </label>
            {/* <Input
              type="number"
              id="margen"
              name="margen"
              value={Math.round(padding / pixelXCm)}
              placeholder="Margenes"
              onChange={(event) =>
                setPadding(Number(event.target.value) * pixelXCm)
              }
            /> */}
            <div className="flex gap-1">
              <p>0</p>
              <Slider
                defaultValue={[padding / pixelXCm]}
                max={3}
                min={0}
                step={0.1}
                onValueChange={(event) =>
                  setPadding(Number(event[0]) * pixelXCm)
                }
              />
              <p>3</p>
            </div>
            <Button
              className="shadow-sm border shadow-black"
              variant="outline"
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
