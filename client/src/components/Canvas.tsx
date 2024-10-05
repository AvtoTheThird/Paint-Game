import React, { useRef, useEffect, useState, MouseEvent } from "react";
import socket from "./socket"; // Use the same socket instance

const Canvas: React.FC<{ canvasData: { roomId: string; userId: string } }> = ({
  canvasData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawing = useRef<boolean>(false);
  const lastPosition = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState<string>("#000000"); // Default color is black
  const [lineWidth, setLineWidth] = useState<number>(5);
  const [canDraw, setCanDraw] = useState<boolean>(false);
  const [history, setHistory] = useState<string[]>([]); // To keep track of canvas states for undo
  const [tool, setTool] = useState<"draw" | "fill">("draw"); // 'draw' or 'fill'
  const [userId, setUserId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [cursorStyle, setCursorStyle] = useState<string>("default");
  const [isGamePaused, setIsGamePaused] = useState<boolean>(false);
  const [currentDrawer, setCurrentDrawer] = useState<string>("");
  const [oldWord, setOldWord] = useState<string>("");
  const [pauseTime, setPauseTime] = useState<number>(0);
  const [maxRoundsReached, setMaxRoundsReached] = useState<boolean>(false);
  const userIdRef = useRef<string>(""); // Create refs for userId and roomId
  const roomIdRef = useRef<string>("");

  interface CanvasData {
    data: { roomId: string; userId: string };
  }

  useEffect(() => {
    if (pauseTime > 0) {
      const timer = setTimeout(() => {
        setPauseTime(pauseTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [pauseTime]);
  const floodFill = (
    startX: number,
    startY: number,
    fillColor: string,
    emitEvent: boolean = true
  ) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const startColor = getPixelColor(imageData, startX, startY);
    const fillColorRgb = hexToRgb(fillColor);

    // Check if the fill color is the same as the start color
    if (colorMatch(startColor, fillColorRgb)) {
      console.log("Area is already filled with the selected color");
      return;
    }

    const pixelsToCheck = [[startX, startY]];
    const maxPixels = canvas.width * canvas.height;
    let pixelsChecked = 0;
    const maxIterations = Math.min(maxPixels, 200000); // Limit to prevent hanging

    while (pixelsToCheck.length > 0 && pixelsChecked < maxIterations) {
      const [x, y] = pixelsToCheck.pop()!;

      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;

      if (colorMatch(getPixelColor(imageData, x, y), startColor)) {
        setPixelColor(imageData, x, y, fillColorRgb);
        pixelsChecked++;

        // Use 4-way flood fill for better performance
        pixelsToCheck.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    }

    ctx.putImageData(imageData, 0, 0);
    saveCanvasState();

    if (emitEvent) {
      socket.emit("fill", { roomId, startX, startY, fillColor });
    }

    if (pixelsChecked >= maxIterations) {
      console.log("Fill operation stopped to prevent hanging");
    }
  };
  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a new temporary canvas
    const tempCanvas = document.createElement("canvas");
    const context = tempCanvas.getContext("2d");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    // Fill the temp canvas with white background
    if (!context) return;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the original canvas content onto the temp canvas
    context.drawImage(canvas, 0, 0);

    // Download the temp canvas as an image
    const link = document.createElement("a");
    link.href = tempCanvas.toDataURL("image/png");
    link.download = "firosmoney.png";
    link.click();
  };

  const getPixelColor = (
    imageData: ImageData,
    x: number,
    y: number
  ): number[] => {
    const index = (y * imageData.width + x) * 4;
    return Array.from(imageData.data.slice(index, index + 4));
  };

  const setPixelColor = (
    imageData: ImageData,
    x: number,
    y: number,
    color: number[]
  ) => {
    const index = (y * imageData.width + x) * 4;
    imageData.data.set(color, index);
  };

  const colorMatch = (color1: number[], color2: number[]): boolean => {
    return color1.every((value, index) => Math.abs(value - color2[index]) < 5);
  };

  const hexToRgb = (hex: string): number[] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
          255,
        ]
      : [0, 0, 0, 255];
  };
  useEffect(() => {
    // Update cursor style when tool changes
    if (canDraw) {
      setCursorStyle(tool === "draw" ? "pencil" : "bucket");
    } else {
      setCursorStyle("default");
    }
  }, [tool, canDraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctxRef.current = ctx;

    // Function to resize canvas and redraw content
    const resizeCanvas = () => {
      if (!canvasRef.current || !ctxRef.current) return;

      // Save the current canvas content
      const savedImage = ctxRef.current.getImageData(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      // console.log(savedImage);

      // Resize the canvas to the new window size
      canvasRef.current.width = 800;
      canvasRef.current.height = 600;

      // Restore the saved image to the resized canvas
      ctxRef.current.putImageData(savedImage, 0, 0);

      // Reset drawing settings
      ctxRef.current.lineCap = "round";
      ctxRef.current.lineWidth = lineWidth;
    };

    // Initial canvas size
    resizeCanvas();

    // Listen for window resize events
    window.addEventListener("resize", resizeCanvas);

    // Clean up listener on component unmount
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;
    ctxRef.current.lineWidth = lineWidth;
  }, [lineWidth]);
  useEffect(() => {
    setUserId(canvasData.userId);
    setRoomId(canvasData.roomId);

    userIdRef.current = canvasData.userId; // Update the refs whenever canvasData changes
    roomIdRef.current = canvasData.roomId;
  }, [canvasData]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (ctxRef.current) {
      ctxRef.current.fillStyle = "white";
    }
    ctxRef.current = ctx;

    socket.on(
      "draw",
      ({
        x0,
        y0,
        x1,
        y1,
        color,
      }: {
        x0: number;
        y0: number;
        x1: number;
        y1: number;
        color: string;
      }) => {
        if (!ctxRef.current) return;

        ctxRef.current.strokeStyle = color; // Use the color from the server
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(x0, y0);
        ctxRef.current.lineTo(x1, y1);
        ctxRef.current.stroke();
      }
    );

    socket.on("clear", () => {
      if (ctxRef.current) {
        ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
    socket.on("newLineWidth", (data) => {
      setLineWidth(data.newLineWidth);
    });
    socket.on("newDrawer", (data) => {
      // console.log(secretWord);
      // console.log(time);

      setHistory([]);

      if (ctxRef.current) {
        ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
      }
      // console.log(currentDrawer, currentDrawerId);
      // console.log(userId);
      // console.log(canvasData.userId);

      if (data.currentDrawerId !== userIdRef.current) {
        setCanDraw(false);
      } else {
        setCanDraw(true);
      }
    });
    socket.on("undo", (updatedHistory) => {
      setHistory(updatedHistory); // Update the local history state
      redrawCanvas(updatedHistory); // Redraw the canvas
    });
    socket.on("fill", ({ startX, startY, fillColor }) => {
      floodFill(startX, startY, fillColor, false);
    });
    socket.on("handEnded", (data) => {
      setCurrentDrawer(data.currentDrawer);
      setOldWord(data.Word);
      setCanDraw(false);
      setIsGamePaused(true);
      setPauseTime(5);
      // console.log(data);
    });
    socket.on("MaxRoundsReached", () => {
      setMaxRoundsReached(true);
    });
    socket.on("requestCanvasDataFromClient", (roomId, id) => {
      console.log("recived requestCanvasData", id);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctxRef.current = ctx;
      if (!canvasRef.current || !ctxRef.current) return;

      const base64Image = canvas.toDataURL("image/png");

      socket.emit("test");

      const data = { base64Image, id, roomId };
      socket.emit("sendCanvasDataToServer", data);
      console.log("sent data to server", base64Image, id);
    });
    return () => {
      socket.off("draw");
      socket.off("clear");
      socket.off("undo");
      socket.off("newLineWidth");
      socket.off("newDrawer");
      socket.off("fill");
    };
  }, []);
  socket.on("gameStarted", () => {
    setIsGamePaused(false);
    setMaxRoundsReached(false);
  });
  socket.on("newDrawer", (data) => {
    setIsGamePaused(false);
    setHistory([]);
    clearCanvas();
    if (data.currentDrawerId !== userIdRef.current) {
      setCanDraw(false);
    } else {
      setCanDraw(true);
    }
  });

  socket.on("SendCanvasDataToClient", (data) => {
    const base64Image = data.base64Image;
    setCurrentDrawer(data.currentDrawer);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create a new Image object
    const img = new Image();

    // Set the src of the image to the base64 data
    img.src = base64Image;

    // Once the image is loaded, draw it onto the canvas
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    img.onerror = (err) => {
      console.error("Failed to load the image", err);
    };
  });
  const startDrawing = (
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!canDraw) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let offsetX, offsetY;
    const scaleX = canvas.width / canvas.getBoundingClientRect().width;
    const scaleY = canvas.height / canvas.getBoundingClientRect().height;

    if (event.type === "mousedown") {
      event.preventDefault();
      const nativeEvent = (event as React.MouseEvent<HTMLCanvasElement>)
        .nativeEvent;
      offsetX = nativeEvent.offsetX * scaleX;
      offsetY = nativeEvent.offsetY * scaleY;
    } else {
      const touch = (event as React.TouchEvent<HTMLCanvasElement>).touches[0];
      const rect = canvas.getBoundingClientRect();
      offsetX = (touch.clientX - rect.left) * scaleX;
      offsetY = (touch.clientY - rect.top) * scaleY;
    }

    if (tool === "fill") {
      floodFill(Math.floor(offsetX), Math.floor(offsetY), color);
    } else {
      drawing.current = true;
      lastPosition.current = { x: offsetX, y: offsetY };
      draw(event);
    }
  };

  const stopDrawing = () => {
    drawing.current = false;
    if (ctxRef.current) {
      ctxRef.current.closePath();
    }
    saveCanvasState(); // Save state after drawing ends.
    // console.log(history);
  };

  const draw = (
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas || !ctxRef.current) return;

    let offsetX: number, offsetY: number;
    const scaleX = canvas.width / canvas.getBoundingClientRect().width;
    const scaleY = canvas.height / canvas.getBoundingClientRect().height;

    if (event.type === "mousemove") {
      const nativeEvent = (event as React.MouseEvent<HTMLCanvasElement>)
        .nativeEvent;
      offsetX = nativeEvent.offsetX * scaleX; // Scale the coordinates
      offsetY = nativeEvent.offsetY * scaleY;
    } else if (event.type === "touchmove") {
      const touch = (event as React.TouchEvent<HTMLCanvasElement>).touches[0];
      const rect = canvas.getBoundingClientRect();
      offsetX = (touch.clientX - rect.left) * scaleX;
      offsetY = (touch.clientY - rect.top) * scaleY;
    } else {
      return; // Exit if the event type is neither mousemove nor touchmove
    }

    if (lastPosition.current) {
      ctxRef.current.strokeStyle = color; // Set the current color
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(lastPosition.current.x, lastPosition.current.y);
      ctxRef.current.lineTo(offsetX, offsetY);
      ctxRef.current.stroke();
    }

    // Emit draw event to the server, including the color
    socket.emit("draw", {
      roomId: roomId,
      x0: lastPosition.current?.x ?? offsetX,
      y0: lastPosition.current?.y ?? offsetY,
      x1: offsetX,
      y1: offsetY,
      color: color, // Send the selected color
    });

    // Update last position
    lastPosition.current = { x: offsetX, y: offsetY };
  };
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas && ctxRef.current) {
      ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
      socket.emit("clear", roomId); // Notify other clients
    }
  };
  //   console.log(lineWidth);

  const handleLineWithChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLineWidth = parseInt(event.target.value);
    setLineWidth(newLineWidth);
    const data = { newLineWidth, roomId };
    socket.emit("lineWidthChange", data); // Notify other clients
    // console.log("emited shit");
  };
  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const canvasData = canvas.toDataURL();
      setHistory((prevHistory) => [...prevHistory, canvasData]);
    }
  };
  const undoLastAction = () => {
    if (history.length === 0) return; // No history to undo

    const newHistory = [...history];
    newHistory.pop(); // Remove the last saved state
    setHistory(newHistory);

    // Emit undo event to server with the updated history
    socket.emit("undo", { newHistory, roomId });

    redrawCanvas(newHistory);
  };

  const redrawCanvas = (history: string[]) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    if (ctx && canvas && history.length > 0) {
      const lastImage = new Image();
      lastImage.src = history[history.length - 1];
      lastImage.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        ctx.drawImage(lastImage, 0, 0); // Draw the previous state
      };
    } else if (ctx && canvas) {
      // Clear canvas if no history left
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
  // const vw = Math.max(
  //   document.documentElement.clientWidth || 0,
  //   window.innerWidth || 0
  // );
  return (
    <div
      style={{ aspectRatio: `${800} / ${600}` }}
      className="flex flex-col items-center justify-center"
    >
      <div className="relative w-full h-full">
        <canvas
          className={`w-full h-full block border-2 border-black bg-white cursor-${cursorStyle}`}
          ref={canvasRef}
          onMouseDown={canDraw ? startDrawing : undefined}
          onMouseUp={canDraw ? stopDrawing : undefined}
          onMouseMove={canDraw ? draw : undefined}
          onTouchStart={canDraw ? startDrawing : undefined}
          onTouchEnd={canDraw ? stopDrawing : undefined}
          onTouchMove={canDraw ? draw : undefined}
        />
        <button
          id="download"
          onClick={downloadCanvas}
          className="absolute top-2 right-2 bg-black text-white opacity-50 hover:opacity-100 text-sm px-3 py-1 rounded-lg transition-opacity duration-200"
        >
          გადმოწერე
        </button>
        {isGamePaused ? (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center bg-bg-pink p-4 rounded-lg shadow-lg z-50">
            <span className="text-lg">
              სიტყვა იყო <span className="text-blue-700">{oldWord}</span>{" "}
            </span>

            <span className="text-lg">
              ეხლა ხატამს <span className="text-blue-700">{currentDrawer}</span>
            </span>
            <span>{pauseTime}</span>
          </div>
        ) : null}
        {maxRoundsReached ? (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center bg-green-500 p-4 rounded-lg shadow-lg z-50">
            <span className="text-lg">მორჩა კინო</span>

            <span className="text-lg">წადით სახლში</span>
            <span>{pauseTime}</span>
          </div>
        ) : null}
      </div>

      {canDraw ? (
        <div className="flex flex-wrap flex-row gap-4 border-2 border-black bg-bg-white lg:p-5 justify-center lg:w-full w-[95vw] relative ">
          <button onClick={clearCanvas}>Clear Canvas</button>
          <input
            className="lg:m-3"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            // style={{ margin: "10px" }}
          />
          <button onClick={undoLastAction} disabled={history.length === 0}>
            Undo
          </button>
          <button
            onClick={() => setTool("draw")}
            className={tool === "draw" ? "text-blue-800" : "text-black"}
          >
            Draw Tool
          </button>
          <button
            onClick={() => setTool("fill")}
            className={tool === "fill" ? "text-blue-800" : "text-black"}
          >
            Fill Tool
          </button>
          <input
            type="range"
            min="1"
            max="10"
            value={lineWidth}
            onChange={handleLineWithChange}
          />
        </div>
      ) : null}
    </div>
  );
};
export default Canvas;
