import { useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";
import { convertFileSrc } from "@tauri-apps/api/tauri";

const ImageCropper = () => {
  const [images, setImages] = useState([]);
  const [croppedImages, setCroppedImages] = useState([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const cropEmptySpace = (image) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = image.width;
    canvas.height = image.height;

    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let top = canvas.height;
    let bottom = 0;
    let left = canvas.width;
    let right = 0;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const index = (y * canvas.width + x) * 4;
        const alpha = data[index + 3];

        if (alpha > 0) {
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
          left = Math.min(left, x);
          right = Math.max(right, x);
        }
      }
    }

    const cropWidth = right - left + 1;
    const cropHeight = bottom - top + 1;

    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;

    const croppedCtx = croppedCanvas.getContext("2d");
    croppedCtx.drawImage(
      canvas,
      left,
      top,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    return croppedCanvas.toDataURL("image/png");
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    await processFiles(files);
  };

  const handleFolderSelect = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Folder with Images",
      });

      if (selected) {
        const folderFiles = await invoke("get_image_files_in_folder", {
          folder: selected,
        });
        await processFiles(folderFiles);
      }
    } catch (error) {
      console.error("Error selecting folder:", error);
    }
  };

  const processFiles = async (fileList) => {
    setIsProcessing(true);
    setImages([]);
    setCroppedImages([]);

    const processedImages = [];
    const croppedImagesResults = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      // Determine if it's a file path from Tauri or a File object
      let fileUrl = file;
      if (file instanceof File) {
        fileUrl = URL.createObjectURL(file);
      } else {
        // Convert Tauri file path to URL
        fileUrl = convertFileSrc(file);
      }

      try {
        const img = await new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.crossOrigin = "anonymous";
          image.src = fileUrl;
        });

        // Store original image
        processedImages.push(fileUrl);

        // Crop the image
        const croppedDataUrl = cropEmptySpace(img);
        croppedImagesResults.push(croppedDataUrl);

        // Update progress
        setProcessingProgress(Math.round(((i + 1) / fileList.length) * 100));
      } catch (error) {
        console.error("Error processing image:", error);
      }
    }

    setImages(processedImages);
    setCroppedImages(croppedImagesResults);
    setIsProcessing(false);
    setProcessingProgress(0);
  };

  const handleDownloadAll = async () => {
    try {
      croppedImages.forEach((canvas, ind) => {
        console.log(canvas);

        setTimeout(() => {
          const aDownloadLink = document.createElement("a");
          aDownloadLink.href = canvas;
          aDownloadLink.setAttribute(
            "download",
            `${new Date().toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}.png`
          );
          aDownloadLink.click();
          aDownloadLink.remove();
        }, ind * 300);
      });
    } catch (error) {
      alert("Error: " + error);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex space-x-4 mb-4">
        <input
          type="file"
          multiple
          accept="image/png"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current.click()}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Select Files
        </button>
        <button
          onClick={handleFolderSelect}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Select Folder
        </button>
        {croppedImages.length > 0 && (
          <button
            onClick={handleDownloadAll}
            className="px-4 py-2 bg-purple-500 text-white rounded"
          >
            Download All Cropped
          </button>
        )}
      </div>

      {isProcessing && (
        <div className="mb-4">
          <div
            className="h-2 bg-blue-200 rounded-full"
            style={{ width: "100%" }}
          >
            <div
              className="h-2 bg-blue-500 rounded-full"
              style={{ width: `${processingProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Processing images... {processingProgress}%
          </p>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-bold mb-2">Original Images</h3>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Original ${index}`}
                  className="w-full h-24 object-cover border rounded"
                />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2">Cropped Images</h3>
            <div className="grid grid-cols-3 gap-2">
              {croppedImages.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Cropped ${index}`}
                  className="w-full h-24 object-cover border rounded"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCropper;
