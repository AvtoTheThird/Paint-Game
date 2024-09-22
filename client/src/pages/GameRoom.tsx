import { useEffect, useState } from "react";
import Canvas from "../components/Canvas";
import socket from "../components/socket";
import confetti from "canvas-confetti";
import { useLocation } from "react-router-dom";

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
  hasGuessed: boolean;
}
interface CanvasData {
  data: { roomId: string; userId: string };
}

function GameRoom() {
  //   const [roomData, setRoomData] = useState<any>({});
  const [roomId, setRoomId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [messages, setMessages] = useState<RecivedMessage[]>([]);
  const [joinedUsers, setJoinedUsers] = useState<JoinedUsers[]>([]);
  const [roomName, setRoomName] = useState<string>("");
  const [drawWord, setDrawWord] = useState<any>();
  const [userId, setUserId] = useState<string>("");
  const [canDraw, setCanDraw] = useState<boolean>(false);
  const [hasGuesed, setHasGuesed] = useState<boolean>(false);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [secretWord, setSecretWord] = useState<string>("");
  const [currentDrawer, setCurrentDrawer] = useState<any>();
  const [currentDrawerId, setCurrentDrawerId] = useState<any>();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const location = useLocation();
  //   const [roomData, setRoomData] = useState<any>(location.state?.roomData || {});

  // console.log(location.state);
  useEffect(() => {
    setRoomId(location.state.roomId);
    setUserId(location.state.userId);
    setUserName(location.state.userName);
    setIsAdmin(location.state.isAdmin);
  }, [location]);
  function startGame() {
    // console.log(roomData.id);

    socket.emit("startGame", { roomId });
  }
  function skipTurn() {
    socket.emit("skipTurn", { roomId });
  }
  const sendMessage = (e: any) => {
    e.preventDefault();
    console.log(
      timeLeft +
        "timeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLeft"
    );
    if (!hasGuesed && !canDraw) {
      console.log(
        timeLeft +
          "timeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLefttimeLeft"
      );
      socket.emit("guess", {
        roomId: roomId,
        guess: message,
        timeLeft: timeLeft,
      });
    }
    if (message.trim() && roomId) {
      const messageData: Message = { roomId, message, userName };
      console.log(messageData);

      socket.emit("message", messageData);
      setMessage("");
    }

    // console.log(roomData);
  };
  const canvasData = { roomId, userId };
  //   console.log(canvasData);

  useEffect(() => {
    let timer: any;

    if (isGameStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    }

    return () => clearInterval(timer); // Clean up the interval on component unmount
  }, [isGameStarted]);

  useEffect(() => {
    // Listen for messages
    socket.on("message", (message: RecivedMessage) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });
    socket.on("updateUserList", (data) => {
      console.log(data);

      setJoinedUsers(data);
    });
    socket.on("gameStarted", ({ currentDrawer, currentDrawerId }) => {
      setIsGameStarted(true);
      setCurrentDrawer(currentDrawer);
      setCurrentDrawerId(currentDrawerId);
    });

    socket.on(
      "newDrawer",
      ({ currentDrawer, currentDrawerId, secretWord, time }) => {
        // console.log("----gameroom-----");

        // console.log(currentDrawer);
        // console.log(currentDrawerId);
        // console.log("----gameroom-----");

        setTimeLeft(time);
        setCurrentDrawer(currentDrawer);
        setSecretWord(secretWord);
        setHasGuesed(false);
        // console.log(currentDrawerId, "------", userId);
        // console.log(location.state.userId);

        if (currentDrawerId != location.state.userId) {
          setDrawWord(null);
          setCanDraw(false);
        } else {
          setCanDraw(true);
        }
        setJoinedUsers((prevUsers) => {
          const updatedUsers = { ...prevUsers };
          Object.keys(updatedUsers).forEach((userId: any) => {
            updatedUsers[userId].hasGuessed = false;
          });
          return updatedUsers;
        });
      }

      // Set hasGuessed to false for all joinedUsers
    );
    socket.on("newWord", (word) => {
      setDrawWord(word);
    });

    socket.on("conffeti", () => {
      // console.log("recived conffeti");

      handleButtonClick();
    });
    socket.on("correctGuess", (guesser) => {
      if (guesser.guesserId == userId) {
        setHasGuesed(true);
      }

      joinedUsers[guesser.guesserId].hasGuessed = true;
      console.log(joinedUsers);
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
  }, [isGameStarted]);
  const handleButtonClick = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <main className="font-ge-bold bg-no-repeat bg-cover lg:h-screen flex flex-col justify-center items-center">
      {" "}
      <div className="h-[100svh] border-black lg:border-2 border-solid lg:w-[90vw] lg:h-[95vh] flex lg:flex-row flex-col justify-center items-center lg:gap-5 lg:bg-bg-white  rounded-[5rem]">
        {/* marcxena plani */}
        {/* <h1>{roomName}</h1>{" "} */}
        {/* ppl */}
        <div className=" bg-light-pink rounded-[5rem] ml-8 lg:block hidden  h-[90vh] w-[200px] 2xl:w-[300px] overflow-hidden  text-center">
          <p className="text-3xl whitespace-nowrap font-extrabold text-black inline-block pt-5">
            სასტავი:
          </p>
          {
            // Object.values(usersObject);

            Object.values(joinedUsers)
              .sort((a, b) => b.score - a.score)
              .map((user: any, index: number) => (
                <div
                  key={index}
                  className={` flex flex-row justify-between items-center pl-2 ${
                    user.id == currentDrawerId
                      ? "bg-dark-purupe py-5"
                      : "bg-light-purupe py-5"
                  } text-lg `}
                >
                  <p>#{index + 1}</p>
                  <p
                    className={`${
                      user.hasGuessed ? "text-green-800" : "text-black"
                    }`}
                  >
                    {user.name}:{user.score}
                    {user.name == userName ? "(შენ)" : null}
                  </p>
                  <hr />
                </div>
              ))
          }
        </div>
        {/* shuala plani */}

        <div className="  flex flex-col justify-center items-center">
          <div className="flex bg-light-pink h-[70px] w-full  rounded-xl justify-between items-center px-5">
            {!isGameStarted && location.state.isAdmin ? (
              <button
                onClick={() => {
                  startGame();
                }}
                className="border-2 border-solid border-blue-900 bg-blue-700 w-[120px] h-[40px] text-md text-white rounded-[30px]"
              >
                start the game
              </button>
            ) : null}
            <p>{timeLeft}</p>
            {drawWord ? (
              <span className="text-black font-bold text-2xl">{drawWord}</span>
            ) : (
              <span className="text-black tracking-[0.2rem] font-bold">
                {secretWord}
              </span>
            )}
            {isGameStarted && isAdmin ? (
              <button
                className="border-2 border-solid border-blue-900 bg-blue-700 w-[120px] h-[40px] text-md text-white rounded-[30px]"
                onClick={skipTurn}
              >
                გადართე სვლა
              </button>
            ) : (
              "."
            )}
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
    </main>
  );
}

export default GameRoom;
