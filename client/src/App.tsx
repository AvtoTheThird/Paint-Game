import React, { useEffect, useRef, useState, MouseEvent } from "react";

import confetti from "canvas-confetti";
import Canvas from "./components/Canvas";
import { io, Socket } from "socket.io-client";
import "./index.css";
import socket from "./components/socket";
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

// const socket: Socket = io("http://localhost:3000"); // Replace with your server's URL
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
  const [hasGuesed, setHasGuesed] = useState<boolean>(false);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [secretWord, setSecretWord] = useState<string>("");
  const [currentDrawer, setCurrentDrawer] = useState<any>();

  const [timeLeft, setTimeLeft] = useState<number>(0);
  // const [isActive, setIsActive] = useState(false); // Timer activity state

  useEffect(() => {
    let timer: any;

    if (isGameStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    }

    return () => clearInterval(timer); // Clean up the interval on component unmount
  }, [isGameStarted]);
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

    if (!hasGuesed) {
      socket.emit("guess", { roomId: roomData.id, guess: message });
    }
    console.log(roomData);
  };

  useEffect(() => {
    const rgbToHex = (rgb: string) => {
      const result = rgb.match(/\d+/g);
      if (!result) return null;
      const r = parseInt(result[0]).toString(16).padStart(2, "0");
      const g = parseInt(result[1]).toString(16).padStart(2, "0");
      const b = parseInt(result[2]).toString(16).padStart(2, "0");
      return `#${r}${g}${b}`.toUpperCase();
    };

    if (isRoomJoined) {
      // Listen for messages
      socket.on("message", (message: RecivedMessage) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });
      // socket.on("canvas", (data: { col: number; row: number }) => {
      //   console.log("client recived canvas message");
      // });
      // socket.on("draw", (data) => {
      //   console.log(data);
      // });
      // socket.on("erace", (data: { pixel: string }) => {
      //   console.log(data);
      //   const pixelElement = document.getElementById(data.pixel);
      //   if (pixelElement) {
      //     pixelElement.style.backgroundColor = "";
      //   }
      socket.on("room_not_found", (data: { roomId: string }) => {
        alert(`room with id ${data.roomId} not found`);
        console.log(`room with id ${data.roomId} not found`);
      });
      socket.on("room_not_exist", (data: { message: string }) => {
        alert(`room with id ${data.message} not found`);
        console.log(`room with id ${data.message} not found`);
      });
      // });
      socket.on("updateUserList", (data) => {
        setJoinedUsers(data);

        console.log(data);
        const usersArray = Object.values(joinedUsers);
        console.log(usersArray);
      });
      socket.on("gameStarted", ({ currentDrawer, currentDrawerId, time }) => {
        console.log(currentDrawerId, time);

        // alert(`${currentDrawer} is now drawing!`);
        setIsGameStarted(true);

        setCurrentDrawer(currentDrawer);
        // console.log(currentDrawer, currentDrawerId);
      });

      socket.on(
        "newDrawer",
        ({ currentDrawer, currentDrawerId, secretWord, time }) => {
          setTimeLeft(time);
          setCurrentDrawer(currentDrawer);
          setSecretWord(secretWord);

          if (currentDrawerId != userId) {
            setDrawWord(null);
          }
        }
      );
      socket.on("newWord", (word) => {
        setDrawWord(word);
      });

      socket.on("conffeti", () => {
        console.log("recived conffeti");

        handleButtonClick();
      });
      socket.on("correctGuess", (guesser) => {
        // console.log(guesser);

        if (guesser.guesserId == userId) {
          console.log("correct guess");

          setHasGuesed(true);
        }
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
  }, [isRoomJoined]);
  function startGame() {
    // console.log(roomData.id);

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
  interface CanvasData {
    data: { roomId: string; userId: string };
  }
  // console.log(roomId, userId);
  const canvasData = { roomId, userId };
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

          <div className="flex flex-col items-center justify-center bg-bg-pink rounded-3xl px-10 py-5 shadow-[5px_5px_0px_0px_rgba(109,40,217)]">
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
            <div className="flex gap-5 items-center justify-between pb-3 w-[600px]">
              <p className="text-2xl whitespace-nowrap font-extrabold text-white">
                time
              </p>
              <input
                className="h-[50px] border-2 border-solid border-red-800	rounded-[40px] w-full"
                type="text"
                name=""
                id=""
                onChange={(e) => {
                  setRoomData({
                    ...roomData,
                    time: Number(e.target.value),
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
            {/* <button id="celebrateBtn" onClick={handleButtonClick}>
              log
            </button> */}
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-start bg-bg-white w-[90vw] h-[95vh] rounded-[5rem] ">
          <div className="flex">
            {/* <h1>{roomName}</h1>{" "} */}
            <div className="border borde-2 border-black bg-bg-white rounded-tl-[5rem] rounded-bl-[5rem] h-[95vh] w-[350px] text-center">
              <p className="text-3xl whitespace-nowrap font-extrabold text-black inline-block pt-5">
                სასტავი:
              </p>
              {joinedUsers.length > 0
                ? // Object.values(usersObject);

                  Object.values(joinedUsers).map((user: any) => (
                    <p
                      className={`${
                        user.name == currentDrawer ? "text-red-700" : null
                      } text-lg `}
                    >
                      {user.name}:{user.score}
                      {user.name == userName ? "(შენ)" : null}
                    </p>
                  ))
                : null}
            </div>
          </div>

          <div className="pt-10">
            <div className="flex bg-white h-[70px] rounded-xl justify-between items-center px-5 ">
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
                <span className="text-black font-bold text-2xl">
                  {drawWord}
                </span>
              ) : (
                <span className="text-black tracking-[0.2rem] font-bold">
                  {secretWord}
                </span>
              )}
              <div>.</div>
            </div>

            <Canvas canvasData={canvasData} />
          </div>
          <div className="flex flex-col h-full justify-end bg-bg-white rounded-tr-[5rem] rounded-br-[5rem] w-[350px] overflow-hidden">
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
