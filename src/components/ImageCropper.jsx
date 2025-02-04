import { useRef, useState, useEffect } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import setCanvasPreview from "../setCanvasPreview";
import { useDebounceEffect } from "./useDebounceEffect";
import { canvasPreview } from "./canvasPreview";

const ASPECT_RATIO = 1;
const MIN_DIMENSION = 150;

const ImageCropper = ({
  closeModal,
  updateAvatar,
  enableCircularCrop = false,
  initCrop = {
    unit: "%", // Can be 'px' or '%'
    x: 25,
    y: 25,
    width: 320,
    height: 320,
  },
}) => {
  const reactCropImageId = "reactCropImage";
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const [imgSrc, setImgSrc] = useState("");
  const hiddenAnchorRef = useRef(null);
  const blobUrlRef = useRef("");
  const [crop, setCrop] = useState();
  const [error, setError] = useState("");
  const [completedCrop, setCompletedCrop] = useState();
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [outputSize, setOutputSize] = useState({ width: 320, height: 320 });
  console.log("inside image cropper");
  useEffect(() => {
    console.log("inside image cropper useEffect");
    // Access the DOM element using the current property of the ref
    if (imgRef.current) {
      console.log("imgRef.current"); // This will log the DOM element
      console.log(imgRef.current); // This will log the DOM element
    } else {
    }
  }, []);

  const getCroppedImg = (image, crop) => {
    const canvas = document.createElement("canvas");
    canvas.width = outputSize.width;
    canvas.height = outputSize.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("No 2d context");
    }

    // devicePixelRatio slightly increases sharpness on retina devices
    // at the expense of slightly slower render times and needing to
    // size the image back down if you want to download/upload and be
    // true to the images natural size.
    const pixelRatio = window.devicePixelRatio;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
    // canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

    ctx.scale(pixelRatio, pixelRatio);
    // ctx.imageSmoothingQuality = "high";
    ctx.save();

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;

    // Move the crop origin to the canvas origin (0,0)
    console.log("cropY " + cropY);
    console.log("cropX " + cropX);
    //ctx.translate(-cropX, -cropY);
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      outputSize.width,
      outputSize.height
    );
    ctx.restore();

    //AI code
    //https://stackoverflow.com/questions/26015497/how-to-resize-then-crop-an-image-with-canvas
    //https://stackoverflow.com/questions/19262141/resize-image-with-javascript-canvas-smoothly
    // const canvas = document.createElement("canvas");
    // console.log("image.width " + image.width);
    // console.log("image.height " + image.height);
    // const scaleX = image.naturalWidth / image.width;
    // const scaleY = image.naturalHeight / image.height;

    // canvas.width = outputSize.width;
    // canvas.height = outputSize.height;

    // const ctx = canvas.getContext("2d");
    // ctx.save();
    // ctx.drawImage(
    //   image,
    //   crop.x * scaleX,
    //   crop.y * scaleY,
    //   crop.width * scaleX,
    //   crop.height * scaleY,
    //   0,
    //   0,
    //   outputSize.width,
    //   outputSize.height
    // );
    // ctx.restore();

    return new Promise((resolve) => {
      console.log("Canvas to dataURL 1");
      const useUnstableMethod = false;
      const imageType = "image/jpeg";
      const imageQuality = 0.4;
      if (useUnstableMethod) {
        console.log("Canvas to dataURL 2");
        const url = canvas.toDataURL(imageType, imageQuality);

        resolve(url);
      } else {
        console.log("Canvas to dataURL 3");
        canvas.toBlob(
          (blob) => {
            resolve(URL.createObjectURL(blob));
          },
          imageType,
          imageQuality
        );
      }
    });
  };

  function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
    return centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 90,
        },
        aspect,
        mediaWidth,
        mediaHeight
      ),
      mediaWidth,
      mediaHeight
    );
  }

  async function testing_onDownloadCropClick() {
    const requireDim = 320;
    const image = imgRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!image || !previewCanvas || !completedCrop) {
      throw new Error("Crop canvas does not exist");
    }

    // This will size relative to the uploaded image
    // size. If you want to size according to what they
    // are looking at on screen, remove scaleX + scaleY
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const offscreen = new OffscreenCanvas(
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );
    const ctx = offscreen.getContext("2d");
    var finalc = new OffscreenCanvas(requireDim, requireDim),
      finalctx = finalc.getContext("2d");

    if (!ctx || !finalctx) {
      throw new Error("No 2d context");
    }

    // finalc.width = requireDim;
    // finalc.height = requireDim;
    ctx.drawImage(
      previewCanvas,
      0,
      0,
      previewCanvas.width,
      previewCanvas.height,
      0,
      0,
      offscreen.width,
      offscreen.height
    );

    finalctx.drawImage(previewCanvas, 0, 0, finalc.width, finalc.height);

    // You might want { type: "image/jpeg", quality: <0 to 1> } to
    // reduce image size
    const blob = await finalc.convertToBlob({
      type: "image/jpeg",
      quality: 0.5,
    });

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    blobUrlRef.current = URL.createObjectURL(blob);

    if (hiddenAnchorRef.current) {
      hiddenAnchorRef.current.href = blobUrlRef.current;
      hiddenAnchorRef.current.click();
    }
  }

  async function onDownloadCropClick() {
    const image = imgRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!image || !previewCanvas || !completedCrop) {
      throw new Error("Crop canvas does not exist");
    }

    // This will size relative to the uploaded image
    // size. If you want to size according to what they
    // are looking at on screen, remove scaleX + scaleY
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const offscreen = new OffscreenCanvas(
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );
    const ctx = offscreen.getContext("2d");
    if (!ctx) {
      throw new Error("No 2d context");
    }
    const requireDim = 320;
    ctx.drawImage(
      previewCanvas,
      0,
      0,
      previewCanvas.width,
      previewCanvas.height,
      0,
      0,
      requireDim,
      requireDim
    );
    // You might want { type: "image/jpeg", quality: <0 to 1> } to
    // reduce image size
    const blob = await offscreen.convertToBlob({
      type: "image/png",
    });

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    blobUrlRef.current = URL.createObjectURL(blob);

    if (hiddenAnchorRef.current) {
      hiddenAnchorRef.current.href = blobUrlRef.current;
      hiddenAnchorRef.current.click();
    }
  }

  useDebounceEffect(
    async () => {
      if (
        completedCrop?.width &&
        completedCrop?.height &&
        imgRef.current &&
        previewCanvasRef.current
      ) {
        // We use canvasPreview as it's much faster than imgPreview.
        canvasPreview(
          imgRef.current,
          previewCanvasRef.current,
          completedCrop,
          scale,
          rotate
        );
      }
    },
    100,
    [completedCrop, scale, rotate]
  );

  const onSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      //Image is not created yet.
      const imageElement = new Image();
      const imageUrl = reader.result?.toString() || "";
      imageElement.src = imageUrl;

      imageElement.addEventListener("load", (e) => {
        if (error) setError("");
        const { naturalWidth, naturalHeight } = e.currentTarget;
        if (naturalWidth < MIN_DIMENSION || naturalHeight < MIN_DIMENSION) {
          setError("Image must be at least 150 x 150 pixels.");
          return setImgSrc("");
        }
      });
      setImgSrc(imageUrl);
    });
    reader.readAsDataURL(file);
  };

  const old_onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const cropWidthInPercent = (MIN_DIMENSION / width) * 100;

    const crop = makeAspectCrop(
      {
        unit: "%",
        width: cropWidthInPercent,
      },
      ASPECT_RATIO,
      width,
      height
    );
    const centeredCrop = centerCrop(crop, width, height);
    setCrop(centeredCrop);
  };

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }

  const handleCrop = async (imgElement) => {
    console.log("handleCrop");
    if (!imgSrc || !imgElement) return;
    //const _image = new Image();
    const image = imgElement;
    //image.src = imgSrc;

    const _croppedImageUrl = await getCroppedImg(image, crop);

    console.log("croppedImageUrl");
    console.log(_croppedImageUrl);
    setCroppedImageUrl(_croppedImageUrl);

    return _croppedImageUrl;
  };

  return (
    <>
      <label className="block mb-3 w-fit">
        <span className="sr-only">Choose profile photo</span>
        <input
          type="file"
          accept="image/*"
          onChange={onSelectFile}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-gray-700 file:text-sky-300 hover:file:bg-gray-600"
        />
      </label>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      {imgSrc && (
        <div className="flex flex-col items-center">
          <ReactCrop
            crop={crop}
            onChange={(pixelCrop, percentCrop) => {
              setCrop(percentCrop);
            }}
            circularCrop={enableCircularCrop}
            keepSelection
            aspect={ASPECT_RATIO}
            minWidth={MIN_DIMENSION}
            minHeight={MIN_DIMENSION}
            onComplete={(c) => setCompletedCrop(c)}
          >
            <img
              ref={imgRef}
              src={imgSrc}
              id={reactCropImageId}
              alt="Upload"
              style={{ maxHeight: "70vh" }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
          <button
            className="text-white font-mono text-xs py-2 px-4 rounded-2xl mt-4 bg-sky-500 hover:bg-sky-600"
            onClick={async () => {
              // setCanvasPreview(
              //   imgRef.current, // HTMLImageElement
              //   previewCanvasRef.current, // HTMLCanvasElement
              //   convertToPixelCrop(
              //     crop,
              //     imgRef.current.width,
              //     imgRef.current.height
              //   )
              // );
              const imgDataURL = await handleCrop(imgRef.current);
              // const dataUrl = previewCanvasRef.current.toDataURL();
              //console.log("dataUrl");
              //console.log(dataUrl);
              updateAvatar(imgDataURL);
              // updateAvatar(croppedImageUrl);
              closeModal();
            }}
          >
            Crop Image
          </button>
        </div>
      )}
      {crop && false && (
        <canvas
          ref={previewCanvasRef}
          className="mt-4"
          style={{
            display: "none",
            border: "1px solid black",
            objectFit: "contain",
            width: 150,
            height: 150,
          }}
        />
      )}

      {!!completedCrop && (
        <>
          <div>
            <canvas
              ref={previewCanvasRef}
              style={{
                border: "1px solid black",
                objectFit: "contain",
                width: completedCrop.width,
                height: completedCrop.height,
              }}
            />
          </div>
          <div>
            <button onClick={testing_onDownloadCropClick}>Download Crop</button>
            <div style={{ fontSize: 12, color: "#666" }}>
              If you get a security error when downloading try opening the
              Preview in a new tab (icon near top right).
            </div>
            <a
              href="#hidden"
              ref={hiddenAnchorRef}
              download
              style={{
                position: "absolute",
                top: "-200vh",
                visibility: "hidden",
              }}
            >
              Hidden download
            </a>
          </div>
        </>
      )}
    </>
  );
};
export default ImageCropper;
