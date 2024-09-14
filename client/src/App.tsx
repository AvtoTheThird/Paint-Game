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

    if (!hasGuesed && !canDraw) {
      socket.emit("guess", { roomId: roomData.id, guess: message });
    }
    if (message.trim() && roomId) {
      const messageData: Message = { roomId, message, userName };
      // console.log(messageData);

      socket.emit("message", messageData);
      setMessage("");
    }

    // console.log(roomData);
  };

  useEffect(() => {
    if (isRoomJoined) {
      // Listen for messages

      socket.on("message", (message: RecivedMessage) => {
        // console.log(hasGuesed, message);
        setMessages((prevMessages) => [...prevMessages, message]);
      });

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
          setHasGuesed(false);

          if (currentDrawerId != userId) {
            setDrawWord(null);
            setCanDraw(false);
          } else {
            setCanDraw(true);
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
        if (guesser.guesserId == userId) {
          console.log("HasGuesed has set to true");
          setHasGuesed(true);
          console.log(hasGuesed);
        }
      });

      // Clean up when the component unmounts
      return () => {
        socket.off("message");
        socket.off("canvas");
        socket.off("room_not_found");
        socket.off("room_not_exist");
        socket.off("updateUserList");
        socket.off("gameStarted");
        socket.off("newDrawer");
        socket.off("newWord");
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
    <main className="font-ge-bold bg-no-repeat bg-cover lg:h-screen flex flex-col justify-center items-center">
      {!isRoomJoined ? (
        <div className="border-black lg:border-2 border-solid lg:w-[90vw] lg:h-[95vh] flex flex-col justify-center items-center gap-5 lg:bg-bg-white  rounded-[5rem]">
          <h2 className=" text-[40px] font-extrabold text-white">
            firo$ Money
          </h2>

          <div className="flex flex-col items-center justify-center bg-bg-pink w-[95vw] lg:w-auto rounded-3xl lg:p-10 shadow-[5px_5px_0px_0px_rgba(109,40,217)]">
            {" "}
            <p className="lg:text-2xl text-xl whitespace-nowrap font-extrabold text-white pb-5">
              შედი უკვე შექმნილ ოთახში{" "}
            </p>
            <div className="lg:flex gap-5 items-center justify-between pb-3 lg:w-[600px]">
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
            <div className="lg:flex gap-5 items-center justify-between pb-3 lg:w-[600px]">
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
              className="border-2 border-solid border-blue-900 bg-blue-700 lg:w-[180px] lg:h-[80px] text-2xl lg:p-0 p-3 text-white rounded-[30px]"
              onClick={joinRoom}
            >
              შედი ოთახში
            </button>
          </div>

          <div className="flex flex-col items-center justify-center bg-bg-pink rounded-3xl w-[95vw] lg:w-auto px-10 py-5 shadow-[5px_5px_0px_0px_rgba(109,40,217)]">
            <p className="text-2xl whitespace-nowrap font-extrabold text-white pb-5">
              შექმენი ოთახი{" "}
            </p>
            <div className="lg:flex gap-5 items-center justify-between pb-3 lg:w-[600px]">
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

            <div className="lg:flex gap-5 items-center justify-between pb-3 lg:w-[600px]">
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

            <div className="lg:flex gap-5 items-center justify-between pb-3 lg:w-[600px]">
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
            <div className="lg:flex gap-5 items-center justify-between pb-3 lg:w-[600px]">
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
        <div className="h-[100svh] border-black lg:border-2 border-solid lg:w-[90vw] lg:h-[95vh] flex lg:flex-row flex-col justify-center items-center lg:gap-5 lg:bg-bg-white  rounded-[5rem]">
          {/* marcxena plani */}
          {/* <h1>{roomName}</h1>{" "} */}
          {/* ppl */}
          <div className=" bg-light-pink rounded-[5rem] ml-8 lg:block hidden  h-[90vh] w-[200px] 2xl:w-[300px] overflow-hidden  text-center">
            <p className="text-3xl whitespace-nowrap font-extrabold text-black inline-block pt-5">
              სასტავი:
            </p>
            {joinedUsers.length > 0
              ? // Object.values(usersObject);

                Object.values(joinedUsers)
                  .sort((a, b) => b.score - a.score)
                  .map((user: any, index: number) => (
                    <div key={index}>
                      <p
                        className={`${
                          user.name == currentDrawer
                            ? "bg-dark-purupe py-5"
                            : "bg-light-purupe py-5"
                        } text-lg `}
                      >
                        {user.name}:{user.score}
                        {user.name == userName ? "(შენ)" : null}
                      </p>
                      <hr />
                    </div>
                  ))
              : null}
          </div>
          {/* shuala plani */}

          <div className="  flex flex-col justify-center items-center">
            <div className="flex bg-light-pink h-[70px] w-full  rounded-xl justify-between items-center px-5">
              {isGameStarted ? null : (
                <button
                  onClick={() => {
                    startGame();
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

            <div className="w-full max-w-screen-lg mx-auto">
              <Canvas canvasData={canvasData} />
            </div>
          </div>

          <div className="flex justify-between gap-3">
            {" "}
            <div className=" overflow-y-scroll bg-light-pink rounded-[1rem] lg:rounded-[5rem]   lg:h-[90vh] w-[40vw] overflow-hidden  text-center lg:hidden">
              <p className="text-3xl whitespace-nowrap font-extrabold text-black inline-block pt-5">
                სასტავი:
              </p>
              {joinedUsers.length > 0
                ? // Object.values(usersObject);

                  Object.values(joinedUsers)
                    .sort((a, b) => b.score - a.score)
                    .map((user: any, index: number) => (
                      <div key={index}>
                        <p
                          className={`${
                            user.name == currentDrawer
                              ? "bg-dark-purupe py-5"
                              : "bg-light-purupe py-5"
                          } text-lg `}
                        >
                          {user.name}:{user.score}
                          {user.name == userName ? "(შენ)" : null}
                        </p>
                        <hr />
                      </div>
                    ))
                : null}
            </div>
            <div
              id="chat"
              className="flex flex-col lg:h-[90vh] justify-between items-center bg-light-pink lg:mr-8 rounded-[1rem] lg:rounded-[4rem] lg:w-[200px] 2xl:w-[300px] pb-5"
            >
              <span className="text-3xl ">ჩატი</span>
              <div className="lg:w-[250px]  w-[40vw] overflow-x-scroll  lg:h-full h-[30vh] flex items-center justify-center flex-col   ">
                <div className="bg-white  lg:h-full h-[30vh]  m-2  rounded-lg  flex justify-end flex-col w-full ">
                  {messages.map((msg, index) => (
                    <div key={index}>
                      <p
                        className={`break-all ${
                          msg.userName == "game" ? "bg-green-600" : ""
                        }`}
                      >
                        {msg.userName == "game" ? null : msg.userName + ":"}
                        {msg.message}
                      </p>{" "}
                      <hr />
                    </div>
                  ))}
                </div>
                <form onSubmit={sendMessage}>
                  <input
                    className="h-[35px] rounded-3xl text-center"
                    type="text"
                    placeholder="Enter message"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                    }}
                  />
                  <button type="submit" className="">
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ChatRoom;
