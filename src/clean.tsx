import { useEffect, useState } from "react";
import { read, utils } from "xlsx";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { BaseDirectory, readDir } from "@tauri-apps/api/fs";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { ModeToggle } from "./components/mode-toggle";
import { Slider } from "./components/ui/slider";
import sharp from "sharp";

export default function App() {
  const [ancho, setAncho] = useState(9800);
  const [alto, setAlto] = useState(9800);
  const [padding, setPadding] = useState(49);
  const [file, setFile] = useState<File>();
  const [images, setImages] = useState<{ nombre: string; path: string }[]>([]);
  const [canvases, setCanvases] = useState([]);
  const [currentCanvasIndex, setCurrentCanvasIndex] = useState(0);

  useEffect(() => {
    //CARGA LAS IMAGENES DEL DIRECTORIO
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

  //PIXELS POR CM
  const pixelXCm = 98;

  //LIMPIA EL CANVAS
  async function handleClear() {
    // const canvas: HTMLCanvasElement = document.getElementById(
    //   "canvas"
    // ) as HTMLCanvasElement;
    // const ctx = canvas.getContext("2d");
    // //@ts-ignore
    // ctx.clearRect(0, 0, ancho, alto);
    setCanvases([]);
  }

  //DOWNLOAD THE CANVAS IN PNG IMAGE
  function handleDownload() {
    canvases.forEach((canvas) => {
      const aDownloadLink = document.createElement("a");
      aDownloadLink.download = "canvas_image.png";
      aDownloadLink.href = canvas;
      aDownloadLink.click();
    });
  }

  //GENERA EL CANVAS ACOMODODANDO LAS IMAGENES HORIZONTALMENTE HASTA Q NO HAY LUGAR Y BAJA VERTICALMENTE
  async function handleGenerate(event: { preventDefault: () => void }) {
    event.preventDefault();
    setCanvases([]);

    //SI CARGA ARCHIVO DE PEDIDO
    if (file) {
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
        let currentX = 100;
        let currentY = 100;

        const newCanvas = document.createElement("canvas");
        newCanvas.id = "canvas";
        newCanvas.className = "h-full w-full";
        newCanvas.width = ancho;
        newCanvas.height = alto;
        const ctx = newCanvas.getContext("2d")!;

        //Red Border
        ctx.lineWidth = 50;
        ctx.strokeStyle = "red";
        ctx.strokeRect(0, 0, ancho, alto); //for white background

        const groupedData = {};

        // data.forEach((item) => {
        //   const orden = item["Número de pedido"];
        //   if (!groupedData[orden]) {
        //     groupedData[orden] = [];
        //   }
        //   groupedData[orden].push(item);
        // });

        console.log(groupedData);

        //LOGICA POR CADA IMAGEN
        data.forEach(async (d, index) => {
          //@ts-ignore
          let order = d["Número de pedido"];
          console.log(order);

          //@ts-ignore
          let amount = d["Cantidad (- reembolso)"];
          for (let i = 0; i < amount; i++) {
            const img = new Image();
            img.crossOrigin = "anonymous";

            // When the image is loaded, calculate dimensions and draw
            img.onload = function () {
              const scale = desiredHeight / img.height;
              const scaledWidth = img.width * scale;

              if (currentX + scaledWidth + 100 > newCanvas.width) {
                // Move to the next row if there's not enough space
                currentX = 100;
                currentY += desiredHeight + padding;
              }

              if (currentY + desiredHeight + 100 > alto) {
                //@ts-ignore
                setCanvases((prevArray) => [
                  ...prevArray,
                  newCanvas.toDataURL("image/png"),
                ]);
                currentX = 100;
                currentY = 100;
                ctx.lineWidth = 50;
                ctx.strokeStyle = "red";
                ctx.clearRect(0, 0, ancho, alto);
                ctx.strokeRect(0, 0, ancho, alto);
              }

              if (index === data.length - 1) {
                //@ts-ignore
                setCanvases((prevArray) => [
                  ...prevArray,
                  newCanvas.toDataURL("image/png"),
                ]);
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

            // FUENTE DE LAS IMAGENES

            //PUBLICA
            //@ts-ignore
            //img.src = `/stickers/${d["Nombre del artículo"].toLowerCase()}.png`;

            //LOCAL
            let im = images.find(
              (i) =>
                //@ts-ignore
                i.nombre === `${d["Nombre del artículo"].toLowerCase()}.png`
            );
            //@ts-ignore
            img.src = im.path;
          }
        });
        //document.getElementById("canvasContainer")?.appendChild(newCanvas);
      };
    } else {
      alert("Seleccione un archivo de pedido");
    }
  }
  function handleNextCanvas() {
    setCurrentCanvasIndex((prevIndex) =>
      prevIndex < canvases.length - 1 ? prevIndex + 1 : prevIndex
    );
  }

  function handlePrevCanvas() {
    setCurrentCanvasIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : prevIndex
    );
  }

  return (
    <section>
      <div className="absolute right-4 top-4">
        <ModeToggle />
      </div>
      <div className="flex justify-center gap-32 items-center text-center w-screen h-screen">
        <div className="h-3/4 flex flex-col justify-center">
          <div id="canvasContainer" className={`h-[550px] w-[550px] mb-6`}>
            {canvases.length > 1 ? (
              <div>
                <img src={canvases[currentCanvasIndex]} alt="" />
                <div className="flex items-center justify-center mt-4 relative bottom-2">
                  <button onClick={handlePrevCanvas}>&lt;</button>
                  <span>
                    {currentCanvasIndex + 1} / {canvases.length}
                  </span>
                  <button onClick={handleNextCanvas}>&gt;</button>
                </div>
              </div>
            ) : (
              <img src={canvases[0]} alt="" />
            )}
          </div>
          <div className="flex flex-col w-1/2 mt-2 mx-auto gap-2">
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
        </div>
        <div className="flex flex-col items-center border h-2/3 w-[300px] justify-around border-black shadow-xl">
          <form className="w-2/3 flex flex-col gap-8" onSubmit={handleGenerate}>
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

            {/*   CARPETA FUENTE DE IMAGENES
            
            <label className="" htmlFor="imageFolder">
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
              step={1}
              className="text-center w-2/3 mx-auto"
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
              step={1}
              className="text-center w-2/3 mx-auto"
              onChange={(event) =>
                setAlto(Number(event.target.value) * pixelXCm)
              }
            />
            <label className="" htmlFor="margen">
              {`Margenes: ${Math.round((padding / pixelXCm) * 100) / 100} Cm`}
            </label>
            <div className="flex gap-1">
              <p>0</p>
              <Slider
                id="margen"
                defaultValue={[padding / pixelXCm]}
                max={3}
                min={0}
                step={0.1}
                onValueChange={(event: any[]) =>
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
