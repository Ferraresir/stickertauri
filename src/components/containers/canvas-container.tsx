import { useEffect, useState } from "react";
import { read, utils } from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BaseDirectory, readDir, writeBinaryFile } from "@tauri-apps/api/fs";
import { save } from "@tauri-apps/api/dialog";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { Slider } from "@/components/ui/slider";
import { ThickArrowLeftIcon, ThickArrowRightIcon } from "@radix-ui/react-icons";
import { useToast } from "@/components/ui/use-toast";

export default function Clean() {
  const [ancho, setAncho] = useState(9800);
  const [alto, setAlto] = useState(9800);
  const [padding, setPadding] = useState(49);
  const [file, setFile] = useState<File>();
  const [images, setImages] = useState<{ name: string; path: string }[]>([]);
  const [canvases, setCanvases] = useState([]);
  const [currentCanvasIndex, setCurrentCanvasIndex] = useState(0);

  const { toast } = useToast();

  useEffect(() => {
    setImages([]);
    //CARGA LAS IMAGENES DEL DIRECTORIO

    //readDir("Tienda de calcos 3.0\\Categorias", {
    readDir("C:\\Tienda de calcos 3.0\\Categorias\\", {
      recursive: true,
    }).then((imgs) => {
      imgs.forEach((entry) => {
        Object.values(entry)[0].forEach((e: { name: string; path: string }) => {
          e.name = e.path.split("\\")[3] + " " + e.path.split("\\")[4];
          e.path = convertFileSrc(e.path);
          setImages((old) => [...old, e]);
        });
      });
    });
  }, []);

  //PIXELS POR CM
  const pixelXCm = 98;

  //LIMPIA EL CANVAS
  async function handleClear() {
    setCanvases([]);
    setCurrentCanvasIndex(0);
  }

  //DOWNLOAD THE CANVAS IN PNG IMAGE

  function handleDownload() {
    canvases.forEach(async (canvas) => {
      // try {
      //   // Remove the data URL prefix (e.g., 'data:image/png;base64,')
      //   const data = canvas.replace(/^data:image\/\w+;base64,/, "");

      //   // Decode the base64 data into binary format
      //   const binaryString = atob(data);

      //   // Create a Uint8Array from the binary string
      //   const length = binaryString.length;
      //   const binaryArray = new Uint8Array(length);
      //   for (let i = 0; i < length; i++) {
      //     binaryArray[i] = binaryString.charCodeAt(i);
      //   }
      //   await writeBinaryFile('avatar.png',data, { dir: BaseDirectory.Download });
      //   console.log(binaryArray);
      // } catch (error) {
      //   console.log(error);

      //   toast({
      //     title: "No se puedo guardar la imagen",
      //     variant: "destructive",
      //   });
      // }
      const aDownloadLink = document.createElement("a");
      aDownloadLink.setAttribute("download", "true");
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
  function handleGenerate(event: { preventDefault: () => void }) {
    event.preventDefault();
    setCanvases([]);
    setCurrentCanvasIndex(0);
    //@ts-ignore
    let arraycanvas = [];

    if (file) {
      try {
        //ALTO DE IMAGEN CALCULADO EN PIXELES
        const desiredHeight = 6 * pixelXCm; // 6 cm to pixels (assuming 1 cm = 37.8 pixels)

        //START POINT IN CANVAS
        let currentX = 100;
        let currentY = 100;

        //CREATE CANVAS
        const newCanvas = document.createElement("canvas");
        newCanvas.id = "temp";
        newCanvas.className = "h-full w-full";
        newCanvas.width = ancho;
        newCanvas.height = alto;
        const ctx = newCanvas.getContext("2d")!;

        document.getElementById("tempcanvas")?.classList.remove("hidden");
        document.getElementById("tempcanvas")?.appendChild(newCanvas);

        //Red Border
        ctx.lineWidth = 2;
        ctx.strokeStyle = "red";
        ctx.strokeRect(0, 0, ancho, alto);

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

          console.log(groupedData);

          let drawnCount = 0;
          const imgs: any = [];
          let pageCounter = 0;

          Object.values(groupedData).forEach((order) => {
            console.log(order);

            let fakeOrder = {
              "Cantidad (- reembolso)": 1,
              "Nombre del artículo": "utils findeorden",
            };
            //@ts-ignore
            order.push(fakeOrder);
            //@ts-ignore
            order.forEach((i, eachidx) => {
              for (let c = 0; c < i["Cantidad (- reembolso)"]; c++) {
                let counter = 0;
                const img = new Image();
                img.crossOrigin = "anonymous";
                const imgIdx = imgs.length;
                let im = images.find(
                  (d) =>
                    d.name === `${i["Nombre del artículo"].toLowerCase()}.png`
                );
                if (im === undefined) {
                  alert(
                    `No se encontro la imagen "${i["Nombre del artículo"]}"`
                  );
                }
                //@ts-ignore
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
                      ctx.fillText(`${pageCounter}`, ancho - 100, alto - 100);
                      // //@ts-ignore
                      // setCanvases((prevArray) => [
                      //   ...prevArray,
                      //   newCanvas.toDataURL(),
                      // ]);
                      arraycanvas.push(newCanvas.toDataURL());
                      currentX = 100;
                      currentY = 100;
                      ctx.reset();

                      //Red Border
                      ctx.lineWidth = 2;
                      ctx.strokeStyle = "red";
                      ctx.strokeRect(0, 0, ancho, alto);
                    }
                    if (imgs[drawnCount].src.endsWith("findeorden.png")) {
                      ctx.save();
                      ctx.textAlign = "center";
                      ctx.textBaseline = "middle";
                      ctx.translate(currentX, currentY);
                      ctx.rotate(Math.PI / 0.66669);
                      ctx.fillStyle = "#1E1F1C";
                      ctx.font = "45px Bebas Neue";

                      //@ts-ignore
                      ctx.fillText(
                        //@ts-ignore
                        `${order[0][
                          "Nombre (facturación)"
                          //@ts-ignore
                        ].toUpperCase()} ${order[0][
                          "Apellidos (facturación)"
                        ].toUpperCase()}`,
                        -400,
                        100,
                        335
                      );
                      ctx.restore();
                    }

                    ctx.globalCompositeOperation = "destination-over";
                    ctx.drawImage(
                      imgs[drawnCount++],
                      currentX,
                      currentY,
                      scaledWidth,
                      desiredHeight
                    );
                    currentX += scaledWidth + padding;

                    if (drawnCount === imgs.length) {
                      ctx.fillStyle = "white";
                      ctx.font = "bold 100px Arial";
                      if (pageCounter >= 1) {
                        pageCounter++;
                        ctx.fillText(`${pageCounter}`, ancho - 100, alto - 100);
                      }
                      ctx.lineWidth = 2;
                      ctx.strokeStyle = "red";
                      ctx.strokeRect(0, 0, ancho, alto);
                      arraycanvas.push(newCanvas.toDataURL());
                      // //@ts-ignore
                      // setCanvases((prevArray) => [
                      //   ...prevArray,
                      //   newCanvas.toDataURL(),
                      // ]);
                      //@ts-ignore
                      arraycanvas.forEach((element) => {
                        //@ts-ignore
                        setCanvases((prevArray) => [...prevArray, element]);
                      });
                      document
                        .getElementById("tempcanvas")
                        ?.classList.add("hidden");
                      document.getElementById("temp")?.remove();
                    }
                  }
                };
                imgs.push(null);
              }
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
      <div className="flex justify-center gap-36 items-center text-center w-screen h-screen">
        <div className="h-3/4 flex flex-col justify-center">
          <div id="canvasContainer" className={`h-[500px] w-[500px] mb-5`}>
            <div id="tempcanvas" className={`h-[500px] w-[500px] mb-6`}></div>
            {canvases.length >= 1 && (
              <div className="w-full h-full">
                <img src={canvases[currentCanvasIndex]} alt="canvas" />
                <div className="flex items-center justify-center gap-2 mt-3 relative bottom-2">
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
            )}
          </div>
          <div className="flex flex-col w-1/2 mt-2 mx-auto gap-1">
            <Button
              className="border border-black mt-1 hover:bg-yellow-200"
              onClick={() => {
                handleDownload();
              }}
            >
              Descargar Imagen
            </Button>
            <Button
              variant="destructive"
              className="border hover:bg-red-600"
              onClick={() => {
                handleClear();
              }}
            >
              Limpiar canvas
            </Button>
          </div>
        </div>
        <div className="flex flex-col items-center border h-2/3 w-[300px] justify-around border-black shadow-xl">
          <form
            className="w-2/3 flex flex-col gap-12"
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
            <div className="flex">
              <div>
                <label className="" htmlFor="ancho">
                  Ancho
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
              </div>
              <div>
                <label className="" htmlFor="alto">
                  Alto
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
              </div>
            </div>
            <div className="flex flex-col gap-2">
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
                  id="margen"
                  name="margen"
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
            </div>
            <Button
              className="shadow-sm border shadow-black hover:bg-yellow-200"
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
