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
  const userIdRef = useRef<string>(""); // Create refs for userId and roomId
  const roomIdRef = useRef<string>("");

  interface CanvasData {
    data: { roomId: string; userId: string };
  }
  // console.log(canvasData.userId);
  // const roomId = canvasData.roomId;
  // const userId = canvasData.userId;
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

      //   console.log(data);
    });
    socket.on("newDrawer", ({ currentDrawer, currentDrawerId }) => {
      setHistory([]);
      console.log(currentDrawer);

      if (ctxRef.current) {
        ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
      }
      // console.log(currentDrawer, currentDrawerId);
      console.log(userId);
      console.log(canvasData.userId);

      if (currentDrawerId !== userIdRef.current) {
        setCanDraw(false);
      } else {
        setCanDraw(true);
      }
    });
    socket.on("undo", (updatedHistory) => {
      setHistory(updatedHistory); // Update the local history state
      redrawCanvas(updatedHistory); // Redraw the canvas
    });
    return () => {
      socket.off("draw");
      socket.off("clear");
      socket.off("undo");
    };
  }, []);

  const startDrawing = (
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
  ) => {
    event.preventDefault();

    drawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let offsetX, offsetY;
    const scaleX = canvas.width / canvas.getBoundingClientRect().width;
    const scaleY = canvas.height / canvas.getBoundingClientRect().height;

    if (event.type === "mousedown") {
      event.preventDefault();

      const nativeEvent = (event as React.MouseEvent<HTMLCanvasElement>)
        .nativeEvent;
      offsetX = nativeEvent.offsetX * scaleX; // Scale the coordinates
      offsetY = nativeEvent.offsetY * scaleY;
    } else {
      const touch = (event as React.TouchEvent<HTMLCanvasElement>).touches[0];
      const rect = canvas.getBoundingClientRect();
      offsetX = (touch.clientX - rect.left) * scaleX;
      offsetY = (touch.clientY - rect.top) * scaleY;
    }

    // Set the starting point of the drawing
    lastPosition.current = { x: offsetX, y: offsetY };

    draw(event); // Start drawing
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
    event.preventDefault();

    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas || !ctxRef.current) return;

    let offsetX: number, offsetY: number;
    const scaleX = canvas.width / canvas.getBoundingClientRect().width;
    const scaleY = canvas.height / canvas.getBoundingClientRect().height;

    if (event.type === "mousemove") {
      event.preventDefault();
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
  const vw = Math.max(
    document.documentElement.clientWidth || 0,
    window.innerWidth || 0
  );
  return (
    <div
      style={{ aspectRatio: `${800} / ${600}` }}
      className="flex flex-col items-center justify-center"
    >
      <canvas
        // className={`border-2 border-black bg-white   ${
        //   vw < 768 ? "w-[300px]" : "scale-[1]"
        // } `}
        className="w-full h-full block border-2 border-black bg-white"
        ref={canvasRef}
        onMouseDown={canDraw ? startDrawing : undefined}
        onMouseUp={canDraw ? stopDrawing : undefined}
        onMouseMove={canDraw ? draw : undefined}
        onTouchStart={canDraw ? startDrawing : undefined}
        onTouchEnd={canDraw ? stopDrawing : undefined}
        onTouchMove={canDraw ? draw : undefined}
      />

      {canDraw ? (
        <div className="flex flex-wrap flex-row gap-4 border-2 border-black bg-bg-white lg:p-5 justify-center lg:w-full w-[95vw]">
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
          <button onClick={() => setTool("draw")}>Draw Tool</button>
          <button onClick={() => setTool("fill")}>Fill Tool</button>
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
