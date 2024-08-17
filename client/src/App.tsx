import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Message {
  roomId: string;
  message: string;
  userName: string;
}
interface RecivedMessage {
  message: string;
  userName: string;
}
interface JoinedUsers {
  id: string;
  name: string;
}
interface RoomData {
  id: string;
  name: string;
  maxPlayers: number;
  owner: string;
}
const socket: Socket = io("http://localhost:3000"); // Replace with your server's URL

const ChatRoom: React.FC = () => {
  const [roomData, setRoomData] = useState<any>({});
  const [roomId, setRoomId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [messages, setMessages] = useState<RecivedMessage[]>([]);
  const [isRoomJoined, setIsRoomJoined] = useState<boolean>(false);
  const [joinedUsers, setJoinedUsers] = useState<JoinedUsers[]>([]);
  const [roomName, setRoomName] = useState<string>("");
  // Refs for the DOM elements
  const colRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingButtonRef = useRef<HTMLButtonElement>(null);
  const displayedPixelSizeRef = useRef<HTMLInputElement>(null);
  const finalPixelSizeRef = useRef<HTMLInputElement>(null);
  const colorWheelRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const joinRoom = () => {
    if (roomId.trim()) {
      let dataToBeSent = { roomId, name: userName };
      // console.log("data to be sent", dataToBeSent);

      socket.emit("join_room", dataToBeSent);
      socket.on("roomError", (data) => {
        alert(data.error);
        setIsRoomJoined(false);
        return;
      });

      socket.on("userJoined", (data) => {
        console.log(data);
        setRoomName(data.roomName);
        setIsRoomJoined(true);
      });

      // setIsRoomJoined(true);
      // Optionally, you can add some user feedback here
      // setIsRoomJoined(true);
    }
  };
  const createRoom = () => {
    socket.emit("create_room", { ...roomData });
    // console.log(roomData);
  };
  // socket.on("roomCreated", (data) => {
  //   console.log(data);
  // });
  const sendMessage = () => {
    if (message.trim() && roomId) {
      const messageData: Message = { roomId, message, userName };
      socket.emit("message", messageData);
      setMessage("");
    }
  };
  const sendCanvasMessage = () => {
    console.log("sendCanvasMessage called");

    if (colRef.current && rowRef.current) {
      const data = {
        col: colRef.current.value,
        row: rowRef.current.value,
        roomId: roomId,
      };

      socket.emit("canvas", data);
    }
  };

  useEffect(() => {
    let isMouseDown = false;
    let drawing = true;
    let curentColor = "rgb(0,0,0)";

    const col = colRef.current;
    const row = rowRef.current;
    const container = containerRef.current;
    const drawingButton = drawingButtonRef.current;
    const displayedPixelSize = displayedPixelSizeRef.current;
    const finalPixelSize = finalPixelSizeRef.current;
    const colorWheel = colorWheelRef.current;
    const canvas = canvasRef.current;
    // const pixel = useRef(null);

    const toggleLines = document.getElementById("toggle-lines");

    const rgbToHex = (rgb: string) => {
      const result = rgb.match(/\d+/g);
      if (!result) return null;
      const r = parseInt(result[0]).toString(16).padStart(2, "0");
      const g = parseInt(result[1]).toString(16).padStart(2, "0");
      const b = parseInt(result[2]).toString(16).padStart(2, "0");
      return `#${r}${g}${b}`.toUpperCase();
    };

    document.addEventListener("mousedown", () => {
      isMouseDown = true;
    });
    document.addEventListener("mouseup", () => {
      isMouseDown = false;
    });

    document.addEventListener("keypress", (event) => {
      if (event.key === "d") {
        drawing = true;
        if (drawingButton) drawingButton.innerText = "Drawing";
      } else if (event.key === "e") {
        if (drawingButton) drawingButton.innerText = "Eracing";
        drawing = false;
      }
    });

    if (drawingButton) {
      drawingButton.addEventListener("click", () => {
        drawing = !drawing;
        if (drawing) {
          drawingButton.innerText = "Drawing";
        } else {
          drawingButton.innerText = "Eracing";
        }
      });
    }

    const generateCanvas = () => {
      if (!container || !col || !row || !displayedPixelSize) return;
      container.innerHTML = "";
      let rowDiv = document.createElement("div");
      let rowDivChild = document.createElement("div");
      rowDiv.style.display = "flex";
      rowDiv.draggable = false;
      rowDivChild.style.height = `${displayedPixelSize.value}px`;
      rowDivChild.draggable = false;
      rowDivChild.classList.add("pixel");
      rowDivChild.style.width = `${displayedPixelSize.value}px`;
      rowDivChild.style.border = "1px solid black";
      container.style.width = `${
        Number(row.value) * Number(displayedPixelSize.value)
      }px`;

      for (let i = 0; i < Number(row.value); i++) {
        rowDiv.appendChild(rowDivChild.cloneNode(true));
      }

      for (let i = 0; i < Number(col.value); i++) {
        let clonedRowDiv = container.appendChild(rowDiv.cloneNode(true));

        clonedRowDiv.addEventListener("mouseover", (event: Event) => {
          event.preventDefault();
          const mouseEvent = event as MouseEvent;
          if (drawing && isMouseDown) {
            (mouseEvent.target as HTMLElement).style.backgroundColor =
              curentColor;
            socket.emit("draw", {
              roomId: roomId,
              pixel: (mouseEvent.target as HTMLElement).id,
              color: curentColor,
            });
            console.log(
              "emited " +
                (mouseEvent.target as HTMLElement).id +
                " change to some color"
            );
          } else if (!drawing && isMouseDown) {
            (mouseEvent.target as HTMLElement).style.backgroundColor = "";
            socket.emit("erace", {
              roomId: roomId,
              pixel: (mouseEvent.target as HTMLElement).id,
            });
          }
        });

        clonedRowDiv.addEventListener("mousedown", (event: Event) => {
          event.preventDefault();

          const mouseEvent = event as MouseEvent;
          if (drawing) {
            (mouseEvent.target as HTMLElement).style.backgroundColor =
              curentColor;
            socket.emit("draw", {
              roomId: roomId,
              pixel: (mouseEvent.target as HTMLElement).id,
              color: curentColor,
            });
          } else if (!drawing) {
            (mouseEvent.target as HTMLElement).style.backgroundColor = "";
            socket.emit("erace", {
              roomId: roomId,
              pixel: (mouseEvent.target as HTMLElement).id,
            });
          }
        });
      }

      let piexels = document.querySelectorAll(".pixel");
      piexels.forEach((pixel, index) => {
        (pixel as HTMLElement).id = String(index + 1);
      });

      displayedPixelSize.addEventListener("change", () => {
        let children = document.querySelectorAll(".pixel");
        container.style.width = `${
          Number(row.value) * Number(displayedPixelSize.value)
        }px`;

        children.forEach((element) => {
          (
            element as HTMLElement
          ).style.height = `${displayedPixelSize.value}px`;
          (
            element as HTMLElement
          ).style.width = `${displayedPixelSize.value}px`;
        });
      });

      if (toggleLines) {
        toggleLines.addEventListener("click", () => {
          let children = document.querySelectorAll(".pixel");
          children.forEach((element) => {
            (element as HTMLElement).style.border = (element as HTMLElement)
              .style.border
              ? ""
              : "1px solid black";
          });
          container.style.border = container.style.border
            ? ""
            : "1px solid black";
        });
      }
    };

    const downloadImage = () => {
      if (!canvas || !col || !row || !finalPixelSize) return;

      let colorArray: string[][] = [];
      let tempArray: string[] = [];
      const cellSize = finalPixelSize.value ? 10 : Number(finalPixelSize.value);
      const ctx = canvas.getContext("2d")!;
      canvas.width = Number(row.value) * cellSize;
      canvas.height = Number(col.value) * cellSize;
      let rows = container?.childNodes;

      if (!rows) return;

      rows.forEach((rowElement: ChildNode) => {
        const elementNodes = (rowElement as HTMLElement).childNodes;
        elementNodes.forEach((element: ChildNode) => {
          const bgColor = (element as HTMLElement).style.backgroundColor;
          if (bgColor) {
            tempArray.push(rgbToHex(bgColor)!);
          } else {
            tempArray.push("#FFFFFF");
          }
        });
        colorArray.push(tempArray);
        tempArray = [];
      });

      colorArray.forEach((rowColors, y) => {
        rowColors.forEach((color, x) => {
          ctx.fillStyle = color;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        });
      });

      const dataURL = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "image.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    document.getElementById("but")?.addEventListener("click", generateCanvas);
    document
      .getElementById("download-btn")
      ?.addEventListener("click", downloadImage);

    colorWheel?.addEventListener("change", () => {
      curentColor = colorWheel.value;
      let historyDiv = document.getElementById("history");

      if (!historyDiv) return;

      if (historyDiv.childNodes.length < 10) {
        let historyCube = document.createElement("div");
        historyCube.style.width = "40px";
        historyCube.style.height = "40px";
        historyCube.style.cursor = "pointer";
        historyCube.style.backgroundColor = curentColor;
        historyCube.addEventListener("click", (event) => {
          curentColor = rgbToHex(
            (event.target as HTMLElement).style.backgroundColor
          )!;
          colorWheel.value = curentColor;
        });
        historyDiv.appendChild(historyCube);
      } else {
        let lastColorDiv = historyDiv.lastChild as HTMLElement;
        lastColorDiv.remove();
        let historyCube = document.createElement("div");
        historyCube.style.width = "40px";
        historyCube.style.height = "40px";
        historyCube.style.cursor = "pointer";
        historyCube.style.backgroundColor = curentColor;
        historyCube.addEventListener("click", (event) => {
          curentColor = rgbToHex(
            (event.target as HTMLElement).style.backgroundColor
          )!;
          colorWheel.value = curentColor;
        });
        historyDiv.insertBefore(historyCube, historyDiv.firstChild);
      }
    });
    if (isRoomJoined) {
      // Listen for messages
      socket.on("message", (message: RecivedMessage) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });
      socket.on("canvas", (data: { col: number; row: number }) => {
        console.log("client recived canvas message");

        if (rowRef.current && colRef.current) {
          // Convert and validate data
          const rows =
            data.row !== undefined
              ? Number(data.row)
              : data.row
              ? Number(data.row)
              : NaN;
          const cols =
            data.col !== undefined
              ? Number(data.col)
              : data.col
              ? Number(data.col)
              : NaN;

          if (!isNaN(rows) && !isNaN(cols)) {
            // Set the input values as strings
            rowRef.current.value = rows.toString();
            colRef.current.value = cols.toString();
            generateCanvas(); // Call the canvas generation function
          } else {
            console.error("Invalid rows or cols received:", data);
          }
        } else {
          console.error("rowRef or colRef is not defined");
        }
      });
      socket.on("draw", (data: { pixel: string; color: string }) => {
        console.log(data);
        const pixelElement = document.getElementById(data.pixel);
        if (pixelElement) {
          pixelElement.style.backgroundColor = data.color;
        }
      });
      socket.on("erace", (data: { pixel: string }) => {
        console.log(data);
        const pixelElement = document.getElementById(data.pixel);
        if (pixelElement) {
          pixelElement.style.backgroundColor = "";
        }
        socket.on("room_not_found", (data: { roomId: string }) => {
          alert(`room with id ${data.roomId} not found`);
          console.log(`room with id ${data.roomId} not found`);
        });
        socket.on("room_not_exist", (data: { message: string }) => {
          alert(`room with id ${data.message} not found`);
          console.log(`room with id ${data.message} not found`);
        });
      });
      socket.on("updateUserList", (data) => {
        setJoinedUsers(data);

        console.log(data);
      });
      // Clean up when the component unmounts
      return () => {
        socket.off("message");
        socket.off("canvas");
        socket.off("draw");
        socket.off("erace");
        socket.off("room_not_found");
      };
    }

    return () => {
      document.removeEventListener("mousedown", () => {
        isMouseDown = true;
      });
      document.removeEventListener("mouseup", () => {
        isMouseDown = false;
      });
      drawingButton?.removeEventListener("click", () => {
        drawing = !drawing;
        if (drawing) {
          drawingButton.innerText = "Drawing";
        } else {
          drawingButton.innerText = "Eracing";
        }
      });
      document
        .getElementById("but")
        ?.removeEventListener("click", generateCanvas);
      document
        .getElementById("download-btn")
        ?.removeEventListener("click", downloadImage);
    };
  }, [isRoomJoined]);

  return (
    <div>
      {!isRoomJoined ? (
        <div className=" border-black border-2 border-solid">
          <h2>join or crate room</h2>
          <p>enter your name</p>
          <input
            type="text"
            placeholder="Enter your name"
            value={userName}
            onChange={(e) => {
              setUserName(e.target.value);
            }}
          />
          <p>enter room id</p>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
          <div>
            <p>room name</p>
            <input
              type="text"
              name=""
              id=""
              onChange={(e) => {
                setRoomData({ ...roomData, name: e.target.value });
              }}
            />
            <p>room ID/password</p>
            <input
              type="text"
              name=""
              id=""
              onChange={(e) => {
                setRoomData({ ...roomData, id: e.target.value });
              }}
            />
            <p>max players</p>
            <input
              type="text"
              name=""
              id=""
              onChange={(e) => {
                setRoomData({
                  ...roomData,
                  maxPlayers: Number(e.target.value),
                });
              }}
            />

            <button onClick={createRoom}>create room</button>
            <button
              onClick={() => {
                console.log(roomData);
              }}
            >
              log
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex" }}>
            {" "}
            <h1>{roomName}</h1>{" "}
            <div
              style={{
                border: "1px solid black",
                padding: "10px",
                display: "flex",
              }}
            >
              sastavi:
              {joinedUsers.length > 0
                ? joinedUsers.map((user: any) => <p> {user}; </p>)
                : null}
            </div>
          </div>

          <div className="flex" style={{ display: "flex" }}>
            <div>
              <div>
                <input
                  type="text"
                  placeholder="Enter message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button onClick={sendMessage}>Send Message</button>
              </div>
              <div>
                {messages.map((msg, index) => (
                  <p key={index}>
                    {msg.userName}: {msg.message}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <div>
                <div>
                  <label>Columns:</label>
                  <input ref={colRef} type="number" id="col-input" min="1" />
                </div>
                <div>
                  <label>Rows:</label>
                  <input ref={rowRef} type="number" id="row-input" min="1" />
                </div>
                <div>
                  <label>Pixel Size:</label>
                  <input
                    ref={displayedPixelSizeRef}
                    type="range"
                    id="pixel-size"
                    min="1"
                    max="50"
                  />
                </div>
                <div>
                  <label>Final Pixel Size:</label>
                  <input
                    ref={finalPixelSizeRef}
                    type="number"
                    id="final-pixel-size"
                    min="1"
                  />
                </div>
                <button ref={drawingButtonRef} id="drawing-button">
                  Drawing
                </button>
                <button id="but" onClick={sendCanvasMessage}>
                  Generate Canvas
                </button>
                <button id="download-btn">Download Image</button>
                <input ref={colorWheelRef} type="color" id="color-wheel" />
                <div id="history"></div>
              </div>
              <div ref={containerRef} id="container"></div>
              <canvas ref={canvasRef}></canvas>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
