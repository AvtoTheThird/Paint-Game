import React, { useRef, useEffect, useState, useCallback } from "react";
import socket from "./socket"; // Use the same socket instance
import EndOFHandScreen from "./EndOFHandScreen";

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
  // console.log(canvasData);
  const [showSlider, setShowSlider] = useState(false);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  // Handle clicks outside the slider to close it
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (sliderRef.current && !sliderRef.current.contains(event.target)) {
        setShowSlider(false);
      }
    }

    if (showSlider) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSlider]);

  const colorList = [
    "FFFFFF",
    "C1C1C1",
    "EF130B",
    "FF7100",
    "FFE400",
    "00CC00",
    "00FF91",
    "00B2FF",
    "231FD3",
    "A300BA",
    "DF69A7",
    "FFAC8E",
    "A0522D",
    "000000",
    "505050",
    "740B07",
    "C23800",
    "E8A200",
    "004619",
    "00785D",
    "00569E",
    "0E0865",
    "550069",
    "873554",
    "CC774D",
    "63300D",
  ];

  interface EndOFHandScreenData {
    data: { oldWord: string; currentDrawer: string };
  }
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "z") {
        undoLastAction();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [history]);
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

    if (colorMatch(startColor, fillColorRgb)) {
      console.log("Area is already filled with the selected color");
      return;
    }

    const stack: [number, number][] = [[startX, startY]];
    const maxIterations = canvas.width * canvas.height; // Remove arbitrary limit

    const processed = new Uint8Array(canvas.width * canvas.height); // Track processed pixels

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const index = y * canvas.width + x;

      // Skip out of bounds or already processed pixels
      if (
        x < 0 ||
        x >= canvas.width ||
        y < 0 ||
        y >= canvas.height ||
        processed[index]
      )
        continue;

      // Find west and east boundaries
      let westX = x;
      while (
        westX >= 0 &&
        colorMatch(getPixelColor(imageData, westX, y), startColor) &&
        !processed[y * canvas.width + westX]
      ) {
        westX--;
      }
      westX++;

      let eastX = x;
      while (
        eastX < canvas.width &&
        colorMatch(getPixelColor(imageData, eastX, y), startColor) &&
        !processed[y * canvas.width + eastX]
      ) {
        eastX++;
      }
      eastX--;

      // Fill and mark as processed
      for (let fillX = westX; fillX <= eastX; fillX++) {
        setPixelColor(imageData, fillX, y, fillColorRgb);
        processed[y * canvas.width + fillX] = 1;
      }

      // Check adjacent rows
      for (const dy of [-1, 1]) {
        const newY = y + dy;
        if (newY < 0 || newY >= canvas.height) continue;

        for (let fillX = westX; fillX <= eastX; fillX++) {
          if (colorMatch(getPixelColor(imageData, fillX, newY), startColor)) {
            stack.push([fillX, newY]);
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    saveCanvasState();

    if (emitEvent) {
      socket.emit("fill", { roomId, startX, startY, fillColor });
    }
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

  useEffect(() => {
    // Update cursor style when tool changes
    if (canDraw) {
      setCursorStyle(tool === "draw" ? "pencil" : "bucket");
    } else {
      setCursorStyle("default");
    }
  }, [tool, canDraw]);
  const handleNewDrawer = useCallback(
    (data: any) => {
      setIsGamePaused(false);
      setLineWidth(5);
      setHistory([]);
      clearCanvas();
      if (data.currentDrawerId !== userIdRef.current) {
        setCanDraw(false);
      } else {
        setCanDraw(true);
      }
    },
    [userIdRef]
  );
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Socket event handlers
    const handleDraw = ({
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
      ctxRef.current.strokeStyle = color;
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(x0, y0);
      ctxRef.current.lineTo(x1, y1);
      ctxRef.current.stroke();
    };

    const handleClear = () => {
      ctxRef.current?.clearRect(0, 0, canvas.width, canvas.height);
      setHistory([]); // Clear history state
      saveCanvasState(); // Save the cleared state
    };

    const handleNewDrawer = (data: any) => {
      setIsGamePaused(false);

      setLineWidth(5);
      setHistory([]); // Clear history state for new turn
      clearCanvas(); // This will now also save the cleared state due to the change above
      if (data.currentDrawerId !== userIdRef.current) {
        setCanDraw(false);
      } else {
        setCanDraw(true);
      }
    };

    const handleUndo = () => {
      console.log("undo");
      console.log(history);
      
      setHistory((prevHistory) => {
        if (prevHistory.length === 0) return prevHistory; // Should not happen if button is disabled, but good practice
        const newHistory = [...prevHistory];
        newHistory.pop();
        redrawCanvas(newHistory); // Redraw after popping
        return newHistory;
      });
    };

    const handleFill = ({
      startX,
      startY,
      fillColor,
    }: {
      startX: number;
      startY: number;
      fillColor: string;
    }) => {
      floodFill(startX, startY, fillColor, false);
    };

    // Handler to save state when a drawing action finishes
    const handleDrawEnd = () => {
      saveCanvasState();
    };

    const handleHandEnded = (data: { currentDrawer: string; Word: string }) => {
      setCurrentDrawer(data.currentDrawer);
      setOldWord(data.Word);
      setCanDraw(false);
      setIsGamePaused(true);
      setPauseTime(5);
    };

    const handleCanvasDataRequest = (roomId: string, id: string) => {
      const base64Image = canvas.toDataURL("image/png");
      socket.emit("sendCanvasDataToServer", { base64Image, id, roomId });
    };

    const handleMaxRounds = () => setMaxRoundsReached(true);
    const handleGameStarted = () => {
      setIsGamePaused(false);
      setMaxRoundsReached(false);
    };

    const handleCanvasDataReceive = (data: {
      base64Image: string;
      currentDrawer: string;
    }) => {
      const img = new Image();
      img.src = data.base64Image;
      img.onload = () =>
        ctxRef.current?.drawImage(img, 0, 0, canvas.width, canvas.height);
      setCurrentDrawer(data.currentDrawer);
    };

    // Register all socket listeners
    socket.on("draw", handleDraw);
    socket.on("clear", handleClear);
    socket.on("newDrawer", handleNewDrawer);
    socket.on("undo", handleUndo);
    socket.on("fill", handleFill);
    socket.on("handEnded", handleHandEnded);
    socket.on("MaxRoundsReached", handleMaxRounds);
    socket.on("requestCanvasDataFromClient", handleCanvasDataRequest);
    socket.on("gameStarted", handleGameStarted);
    socket.on("SendCanvasDataToClient", handleCanvasDataReceive);
    socket.on("newLineWidth", setLineWidth);
    socket.on("drawEnd", handleDrawEnd); // Listen for drawEnd

    const handleDisconnect = (reason: string) => {
      console.log("Socket disconnected on client. Reason:", reason);
      // Add any additional client-side cleanup or UI updates needed on disconnect here
    };
    socket.on("disconnect", handleDisconnect);

    // Cleanup function
    return () => {
      socket.off("draw", handleDraw);
      socket.off("clear", handleClear);
      socket.off("newDrawer", handleNewDrawer);
      socket.off("undo", handleUndo);
      socket.off("fill", handleFill);
      socket.off("handEnded", handleHandEnded);
      socket.off("MaxRoundsReached", handleMaxRounds);
      socket.off("requestCanvasDataFromClient", handleCanvasDataRequest);
      socket.off("gameStarted", handleGameStarted);
      socket.off("SendCanvasDataToClient", handleCanvasDataReceive);
      socket.off("newLineWidth", setLineWidth);
      socket.off("disconnect", handleDisconnect); // Clean up disconnect listener
      socket.off("drawEnd", handleDrawEnd); // Clean up drawEnd listener
    };
  }, [socket, roomId, userId, isGamePaused]);
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
    // Save the initial blank state
    saveCanvasState();

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
    if (event.type === "mousedown") {
      window.addEventListener("mouseup", stopDrawing, { once: true });
    } else {
      window.addEventListener("touchend", stopDrawing, { once: true });
    }
  };

  const stopDrawing = () => {
    drawing.current = false;
    if (ctxRef.current) {
      ctxRef.current.closePath();
    }
    // Save state locally after the drawing action is complete
    saveCanvasState();
    // Notify others that the drawing action has ended
    socket.emit("drawEnd", { roomId });
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

    // Emit undo event to server - just signal the undo, don't send history
    socket.emit("undo", { roomId });

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
      lastImage.onerror = (error) => {
        console.error("Error loading image for redraw:", error);
        // Optionally clear canvas or show an error state if image fails to load
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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
  const EndOFHandScreenData = { oldWord, currentDrawer };
  // const EndOFGameScreenData = { oldWord, currentDrawer };
  const handleColorClick = (newColor: string) => {
    setColor(`#${newColor}`);
    console.log(newColor);

    // setShowPicker(false);
  };
  return (
    <div
      style={{ aspectRatio: `${800} / ${600}` }}
      className="flex flex-col items-center justify-center gap-1"
    >
      <div className="relative w-full h-full">
        <canvas
          className={`w-full h-full block border-[1px] border-slate-900 bg-white cursor-${cursorStyle}`}
          ref={canvasRef}
          onMouseDown={canDraw ? startDrawing : undefined}
          // onMouseUp={canDraw ? stopDrawing : undefined}
          onMouseMove={canDraw ? draw : undefined}
          onTouchStart={canDraw ? startDrawing : undefined}
          // onTouchEnd={canDraw ? stopDrawing : undefined}
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
          <EndOFHandScreen endOFHandScreenData={EndOFHandScreenData} />
        ) : null}
      </div>

      {canDraw ? (
        <div className="flex flex-wrap flex-row lg:gap-4 gap-x-3 bg-white lg:p-2 p-0 justify-center lg:w-full w-[95vw] relative shadow-lg rounded-b-md ">
          <div className="relative grid grid-cols-13">
            {colorList.map((c) => (
              <div
                key={c}
                className="2xl:w-6 2xl:h-6 w-4 h-4 xl:h-4 xl:w-4 border cursor-pointer hover:border-black"
                style={{ backgroundColor: `#${c}` }}
                onClick={() => handleColorClick(c)}
              ></div>
            ))}
          </div>
          <button onClick={clearCanvas}>
            <img
              alt="clear canvas"
              className="2xl:w-[30px] xl:w-[20px] md:w-[20px] w-[20px]"
              src="/trash.png"
            />
          </button>
          <button onClick={undoLastAction} disabled={history.length === 0}>
            <img
              alt="undo"
              className="2xl:w-[30px] xl:w-[20px] md:w-[20px] w-[20px]"
              src="/undo.png"
            />
          </button>
          <button
            onClick={() => setTool("draw")}
            className={tool === "draw" ? "text-blue-800" : "text-black"}
          >
            <img
              alt="draw tool"
              className="2xl:w-[30px] xl:w-[20px] md:w-[20px] w-[20px]"
              src="/draw.png"
            />
          </button>
          <button
            onClick={() => setTool("fill")}
            className={tool === "fill" ? "text-blue-800" : "text-black"}
          >
            <img
              alt="fill tool"
              className="2xl:w-[30px] xl:w-[20px] md:w-[20px] w-[20px]"
              src="/fill.png"
            />
          </button>
          <button onClick={() => setShowSlider((prev) => !prev)}>
            <img
              src="/line-width.webp"
              className="2xl:w-[30px] xl:w-[20px] md:w-[20px] w-[20px]"
              alt=""
            />{" "}
          </button>

          {showSlider && (
            <div
              ref={sliderRef}
              style={{
                right: "10px",
                bottom: "50px",
                position: "absolute",
                background: "#fff",
                padding: "10px",
                boxShadow: "0 0 10px rgba(0,0,0,0.2)",
              }}
            >
              <input
                type="range"
                min="1"
                max="20"
                value={lineWidth}
                onChange={handleLineWithChange}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
export default Canvas;
