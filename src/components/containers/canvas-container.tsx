import { useEffect, useState } from "react";
import { read, utils } from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BaseDirectory, readDir } from "@tauri-apps/api/fs";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { Slider } from "@/components/ui/slider";
import { ThickArrowLeftIcon, ThickArrowRightIcon } from "@radix-ui/react-icons";

export default function Clean() {
  const [ancho, setAncho] = useState(9800);
  const [alto, setAlto] = useState(9800);
  const [padding, setPadding] = useState(49);
  const [file, setFile] = useState<File>();
  const [images, setImages] = useState<{ nombre: string; path: string }[]>([]);
  const [canvases, setCanvases] = useState([]);
  const [currentCanvasIndex, setCurrentCanvasIndex] = useState(0);

  useEffect(() => {
    //CARGA LAS IMAGENES DEL DIRECTORIO
    readDir("C:\\tiendaimages", {
      recursive: true,
    }).then((imgs) => {
      imgs.forEach((entry) => {
        Object.values(entry)[0].forEach((e) => {
          e.name = e.path.split("\\")[2] + " " + e.path.split("\\")[3];
          e.path = convertFileSrc(e.path);
          setImages((old) => [...old, e]);
        });
      });
    });
  }, []);
  //PIXELS POR CM
  const pixelXCm = 98;
  console.log(images);

  //LIMPIA EL CANVAS
  async function handleClear() {
    setCanvases([]);
  }

  //DOWNLOAD THE CANVAS IN PNG IMAGE
  function handleDownload() {
    canvases.forEach((canvas) => {
      const aDownloadLink = document.createElement("a");
      aDownloadLink.download = `${new Date().toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}.png`;
      aDownloadLink.href = canvas;
      aDownloadLink.click();
    });
  }

  //GENERA EL CANVAS ACOMODODANDO LAS IMAGENES HORIZONTALMENTE HASTA Q NO HAY LUGAR Y BAJA VERTICALMENTE
  async function handleGenerate(event: { preventDefault: () => void }) {
    event.preventDefault();
    setCanvases([]);

    if (file) {
      try {
        //ALTO DE IMAGEN CALCULADO EN PIXELES
        const desiredHeight = 6 * pixelXCm; // 6 cm to pixels (assuming 1 cm = 37.8 pixels)

        //START POINT IN CANVAS
        let currentX = 100;
        let currentY = 100;

        //CREATE CANVAS
        const newCanvas = document.createElement("canvas");
        newCanvas.id = "canvas";
        newCanvas.className = "h-full w-full";
        newCanvas.width = ancho;
        newCanvas.height = alto;
        const ctx = newCanvas.getContext("2d")!;

        //Red Border
        ctx.lineWidth = 18;
        ctx.strokeStyle = "red";
        ctx.strokeRect(0, 0, ancho, alto);
        ctx.save();

        document
          .getElementById("canvasContainer")
          ?.appendChild(newCanvas)
          .setAttribute("id", "newCanvas");

        //LEER EXCEL
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

          //SEPARA POR ORDENES
          const groupedData = {};
          data.forEach((item) => {
            //@ts-ignore
            const orden = item["Número de pedido"];
            //@ts-ignore
            if (!groupedData[orden]) {
              //@ts-ignore
              groupedData[orden] = [];
            }
            //@ts-ignore
            groupedData[orden].push(item);
          });

          let drawnCount = 0;
          const imgs = [];
          let pageCounter = 0;

          Object.values(groupedData).forEach((order) => {
            let fakeOrder = {
              "Cantidad (- reembolso)": 1,
              "Nombre del artículo": "utils findeorden",
            };
            //@ts-ignore
            order.push(fakeOrder);
            //@ts-ignore
            order.forEach((i) => {
              for (let c = 0; c < i["Cantidad (- reembolso)"]; c++) {
                let counter = 0;
                const img = new Image();
                img.crossOrigin = "anonymous";
                const imgIdx = imgs.length;
                let im = images.find(
                  (d) =>
                    //@ts-ignore
                    d.name === `${i["Nombre del artículo"].toLowerCase()}.png`
                );
                //@ts-ignore
                //img.src = "https://asset.localhost/C%3A%5CUsers%5CRamiro%5CDesktop%5Cimages%5CViajes%20y%20mas%201.png"

                img.src = im.path;
                img.onload = () => {
                  imgs[imgIdx] = img;
                  while (imgs[drawnCount]) {
                    counter += 1;
                    let scale = desiredHeight / imgs[drawnCount].height;
                    let scaledWidth = imgs[drawnCount].width * scale;
                    //SI ALCANZA EL LIMITE HORIZONTAL BAJA UNA LINEA
                    if (currentX + scaledWidth + 100 > ancho) {
                      // Move to the next row if there's not enough space
                      currentX = 100;
                      currentY += desiredHeight + padding;
                    }

                    //SI ALCANZA EL LIMITE VERTICAL GUARDA EL CANVAS Y CREA OTRO
                    if (currentY + desiredHeight + 100 > alto) {
                      ctx.fillStyle = "white";
                      ctx.font = "bold 100px Arial";
                      pageCounter++;
                      ctx.fillText(`${pageCounter}`, 9650, 9650);
                      //@ts-ignore
                      setCanvases((prevArray) => [
                        ...prevArray,
                        newCanvas.toDataURL(),
                      ]);
                      currentX = 100;
                      currentY = 100;
                      ctx.reset();
                    }
                    ctx.drawImage(
                      imgs[drawnCount++],
                      currentX,
                      currentY,
                      scaledWidth,
                      desiredHeight
                    );
                    currentX += scaledWidth + padding;
                  }
                };
                imgs.push(null);
                console.log(counter);

                if (Object.values(imgs).length === counter) {
                  alert("Chori");
                }
              }

              // orderCounter++;
              // if (orderCounter === order.length) {
              //   console.log(orderCounter);
              //   console.log(order.length);
              //   console.log(currentX);
              //   console.log(currentY);
              //   orderCounter = 0;
              // }
            });
          });
        };
      } catch (error) {
        console.log("Error" + error);
      }
    } else {
      alert("Seleccione un archivo de orden");
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
      <div className="flex justify-center gap-32 items-center text-center w-screen h-screen">
        <div className="h-3/4 flex flex-col justify-center">
          <div id="canvasContainer" className={`h-[500px] w-[500px] mb-6`}>
            {canvases.length >= 1 ? (
              <div>
                <img src={canvases[currentCanvasIndex]} alt="" />
                <div className="flex items-center justify-center gap-2 mt-4 relative bottom-2">
                  <button onClick={handlePrevCanvas}>
                    <ThickArrowLeftIcon />
                  </button>
                  <span>
                    {currentCanvasIndex + 1} / {canvases.length}
                  </span>
                  <button onClick={handleNextCanvas}>
                    <ThickArrowRightIcon />
                  </button>
                </div>
              </div>
            ) : (
              <p>Genere una imagen</p>
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

            {/* INPUT DE MARGENES MANUAL o SLIDER 
            <Input
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
