import React, { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

import { io, Socket } from "socket.io-client";
import "./index.css";

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
  roomId: string;
  roomName: string;
  score: number;
}
// interface RoomData {
//   id: string;
//   name: string;
//   maxPlayers: number;
//   owner: string;
// }
const socket: Socket = io("http://localhost:3000"); // Replace with your server's URL
// https://paint-game.onrender.com
const ChatRoom: React.FC = () => {
  const [roomData, setRoomData] = useState<any>({});
  const [roomId, setRoomId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [messages, setMessages] = useState<RecivedMessage[]>([]);
  const [isRoomJoined, setIsRoomJoined] = useState<boolean>(false);
  const [joinedUsers, setJoinedUsers] = useState<JoinedUsers[]>([]);
  const [roomName, setRoomName] = useState<string>("");
  const [drawWord, setDrawWord] = useState<any>();
  const [userId, setUserId] = useState<string>("");
  const [canDraw, setCanDraw] = useState<boolean>(false);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);

  const [currentDrawer, setCurrentDrawer] = useState<any>();
  const [timeLeft, setTimeLeft] = useState(10); // Initialize with 90 seconds
  // const [isActive, setIsActive] = useState(false); // Timer activity state

  // Refs for the DOM elements
  const colRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingButtonRef = useRef<HTMLButtonElement>(null);
  const displayedPixelSizeRef = useRef<HTMLInputElement>(null);
  const finalPixelSizeRef = useRef<HTMLInputElement>(null);
  const colorWheelRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let timer: any;

    if (isGameStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // setIsActive(false); // Stop the timer when it reaches 0
      setTimeLeft(10); // Optionally reset the timer to 90 seconds
    }

    return () => clearInterval(timer); // Clean up the interval on component unmount
  }, [isGameStarted, timeLeft]);
  // const startTimer = () => {
  //   console.log("AAAAAAAAAAAAAAAAAAAA");

  //   setIsActive(true);
  // };
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
        setUserId(data.id);
        setRoomData({ ...roomData, id: data.roomId });
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
  const sendMessage = (e: any) => {
    e.preventDefault();
    if (message.trim() && roomId) {
      const messageData: Message = { roomId, message, userName };
      socket.emit("message", messageData);

      setMessage("");
    }

    socket.emit("guess", { roomId: roomData.id, guess: message });
    console.log(roomData);
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
      container.style.border = "1px solid black";
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
          console.log("togle moxda");

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
      }
      // else {
      //   let lastColorDiv = historyDiv.lastChild as HTMLElement;
      //   lastColorDiv.remove();
      //   let historyCube = document.createElement("div");
      //   historyCube.style.width = "40px";
      //   historyCube.style.height = "40px";
      //   historyCube.style.cursor = "pointer";
      //   historyCube.style.backgroundColor = curentColor;
      //   historyCube.addEventListener("click", (event) => {
      //     curentColor = rgbToHex(
      //       (event.target as HTMLElement).style.backgroundColor
      //     )!;
      //     colorWheel.value = curentColor;
      //   });
      //   historyDiv.insertBefore(historyCube, historyDiv.firstChild);
      // }
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
        const usersArray = Object.values(joinedUsers);
        console.log(usersArray);
      });
      socket.on("gameStarted", ({ currentDrawer, currentDrawerId }) => {
        // alert(`${currentDrawer} is now drawing!`);
        setIsGameStarted(true);
        setCurrentDrawer(currentDrawer);
        console.log(currentDrawer, currentDrawerId);

        if (currentDrawerId != userId) {
          // setCanDraw(true);
          if (container) {
            container.style.pointerEvents = "none";
          }
        } else {
          if (container) {
            container.style.pointerEvents = "auto";
          }
        }
        // console.log(canDraw);

        // if (currentDrawerId === userId) {
        //   console.log("shemovedit if shi");
        //   setCanDraw(true);
        //   console.log("Setting canDraw to true");
        //   console.log(canDraw);
        // }
        // console.log(canDraw);

        // Update UI to show the current drawer
      });

      socket.on("newDrawer", ({ currentDrawer, currentDrawerId }) => {
        // alert(`${currentDrawer} is now drawing!`);
        setCurrentDrawer(currentDrawer);

        // console.log(currentDrawer, currentDrawerId);
        // console.log(userId);

        if (currentDrawerId != userId) {
          // setCanDraw(true);
          if (container) {
            setDrawWord(null);

            container.style.pointerEvents = "none";
          }
        } else {
          if (container) {
            container.style.pointerEvents = "auto";
          }
        }
        // Update UI to show the current drawer
      });
      socket.on("newWord", (word) => {
        console.log("Your word to draw:", word);

        setDrawWord(word);
        setTimeLeft(10);
        // Start drawing based on the received word
      });
      socket.on("conffeti", () => {
        console.log("recived conffeti");

        handleButtonClick();
      });
      // socket.on("correctGuess", ({ guesser, guesserId }) => {
      //   console.log(guesser, guesserId);

      //   // alert(`${guesser} guessed the word correctly!`);
      //   setDrawWord(null);
      // });

      // socket.on("incorrectGuess", ({ guesser, guess }) => {
      //   console.log(`${guesser} guessed incorrectly: ${guess}`);
      // });
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
  function startGame() {
    console.log(roomData.id);

    socket.emit("startGame", { roomId: roomData.id });
  }
  const handleButtonClick = () => {
    console.log("bus");

    // Trigger confetti on button click
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <main className="font-ge-bold bg-no-repeat bg-cover h-screen flex flex-col justify-center items-center">
      {!isRoomJoined ? (
        <div className="border-black border-2 border-solid w-[90vw] h-[95vh] flex flex-col justify-center items-center gap-5 bg-bg-white  rounded-[5rem]">
          <h2 className=" text-[40px] font-extrabold text-white">
            firo$ Money
          </h2>

          <div className="flex flex-col items-center justify-center bg-bg-pink rounded-3xl p-10 shadow-[5px_5px_0px_0px_rgba(109,40,217)]">
            {" "}
            <p className="text-2xl whitespace-nowrap font-extrabold text-white pb-5">
              შედი უკვე შექმნილ ოთახში{" "}
            </p>
            <div className="flex gap-5 items-center justify-between pb-3 w-[600px]">
              <p className="text-2xl whitespace-nowrap font-extrabold text-white">
                შეიყვანე სახელი
              </p>
              <input
                className="h-[50px] border-2 border-solid border-red-800	rounded-[40px] w-full"
                type="text"
                // placeholder="Enter your name"
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                }}
              />
            </div>
            <div className="flex gap-5 items-center justify-between pb-3 w-[600px]">
              <p className="text-2xl whitespace-nowrap font-extrabold text-white">
                ოთახის პაროლი
              </p>
              <input
                className="h-[50px] border-2 border-solid border-red-800	rounded-[40px] w-full"
                type="text"
                // placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />
            </div>
            <button
              className="border-2 border-solid border-blue-900 bg-blue-700 w-[180px] h-[80px] text-2xl text-white rounded-[30px]"
              onClick={joinRoom}
            >
              შედი ოთახში
            </button>
          </div>

          <div className="flex flex-col items-center justify-center bg-bg-pink rounded-3xl p-10 shadow-[5px_5px_0px_0px_rgba(109,40,217)]">
            <p className="text-2xl whitespace-nowrap font-extrabold text-white pb-5">
              შექმენი ოთახი{" "}
            </p>
            <div className="flex gap-5 items-center justify-between pb-3 w-[600px]">
              <p className="text-2xl whitespace-nowrap font-extrabold text-white">
                room name
              </p>
              <input
                className="h-[50px] border-2 border-solid border-red-800	rounded-[40px] w-full"
                type="text"
                name=""
                id=""
                onChange={(e) => {
                  setRoomData({ ...roomData, name: e.target.value });
                }}
              />
            </div>

            <div className="flex gap-5 items-center justify-between pb-3 w-[600px]">
              {" "}
              <p className="text-2xl whitespace-nowrap font-extrabold text-white">
                room ID
              </p>
              <input
                className="h-[50px] border-2 border-solid border-red-800	rounded-[40px] w-full"
                type="text"
                name=""
                id=""
                onChange={(e) => {
                  setRoomData({ ...roomData, id: e.target.value });
                }}
              />
            </div>

            <div className="flex gap-5 items-center justify-between pb-3 w-[600px]">
              <p className="text-2xl whitespace-nowrap font-extrabold text-white">
                max players
              </p>
              <input
                className="h-[50px] border-2 border-solid border-red-800	rounded-[40px] w-full"
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
            </div>

            <button
              onClick={createRoom}
              className="border-2 border-solid border-blue-900 bg-blue-700 w-[180px] h-[80px] text-2xl text-white rounded-[30px]"
            >
              შექმენი ოთახი
            </button>
            <button id="celebrateBtn" onClick={handleButtonClick}>
              log
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-start bg-bg-white w-[90vw] h-[95vh] rounded-[5rem] ">
          <div className="flex">
            {/* <h1>{roomName}</h1>{" "} */}
            <div className="border borde-2 border-black bg-bg-white rounded-tl-[5rem] rounded-bl-[5rem] h-[95vh] w-[200px] text-center">
              <p className="text-2xl whitespace-nowrap font-extrabold text-black inline-block">
                სასტავი:
              </p>
              {joinedUsers.length > 0
                ? // Object.values(usersObject);

                  Object.values(joinedUsers).map((user: any) => (
                    <p
                      className={`${
                        user.name == currentDrawer ? "text-red-700" : null
                      }`}
                    >
                      {user.name}:{user.score}
                      {user.name == userName ? "(შენ)" : null}
                    </p>
                  ))
                : null}
            </div>
            {isGameStarted ? null : (
              <button
                onClick={() => {
                  startGame();
                  // setIsGameStarted(true);
                  // startTimer();
                }}
                className="border-2 border-solid border-blue-900 bg-blue-700 w-[120px] h-[40px] text-md text-white rounded-[30px]"
              >
                start the game
              </button>
            )}

            <p>{timeLeft}</p>
            {drawWord ? (
              <span className="text-white font-bold text-lg"> {drawWord}</span>
            ) : null}
          </div>

          <div className="flex">
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
                <button
                  className=" px-3 py-1 border-2 border-black"
                  ref={drawingButtonRef}
                  id="drawing-button"
                >
                  Drawing
                </button>
                <button
                  id="but"
                  onClick={sendCanvasMessage}
                  className=" px-3 py-1 border-2 border-black"
                >
                  Generate Canvas
                </button>
                <button
                  id="download-btn"
                  className=" px-3 py-1 border-2 border-black"
                >
                  Download Image
                </button>
                {/* <button id="toggle-lines">toggle-lines</button> */}

                <input ref={colorWheelRef} type="color" id="color-wheel" />
                <div className="flex" id="history"></div>
              </div>
              <div ref={containerRef} id="container"></div>
              <canvas ref={canvasRef}></canvas>
            </div>
          </div>
          <div className="flex flex-col h-full justify-end bg-bg-white rounded-tr-[5rem] rounded-br-[5rem] w-[250px] overflow-hidden">
            <div>
              {messages.map((msg, index) => (
                <p className="break-all" key={index}>
                  {msg.userName}: {msg.message}
                </p>
              ))}
            </div>
            <form onSubmit={sendMessage}>
              <input
                type="text"
                placeholder="Enter message"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                }}
              />
              <button type="submit">Send</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default ChatRoom;
