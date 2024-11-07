import Canvas from "../components/Canvas";
import socket from "../components/socket";
import confetti from "canvas-confetti";
import { useEffect, useRef, useState } from "react";
import { useLocation, useBeforeUnload, useNavigate } from "react-router-dom";

import Correct_Guess from "/sounds/Correct_Guess.mp3";
import End_Of_Game from "/sounds/End_Of_Game.mp3";
import Hand_Start from "/sounds/Hand_Start.mp3";
import Negative_Hand_Finish from "/sounds/Negative_Hand_Finish.mp3";
import Player_Join from "/sounds/Player_Join.mp3";
import Positive_Hand_Finish from "/sounds/Positive_Hand_Finish.mp3";
import Tick_Clock from "/sounds/Tick_Clock.mp3";
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
  const [currentRound, setCurrentRound] = useState<any>();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isGamePaused, setIsGamePaused] = useState<boolean>(false);
  const [maxRounds, setMaxRounds] = useState<any>();
  const messagesEndRef = useRef(null);

  const location = useLocation();
  //   const [roomData, setRoomData] = useState<any>(location.state?.roomData || {});
  useEffect(() => {
    if (!messagesEndRef.current) return;
    (messagesEndRef.current as HTMLElement)?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    setRoomId(location.state.roomId);
    setUserId(location.state.userId);
    setUserName(location.state.userName);
    setIsAdmin(location.state.isAdmin);
  }, [location]);
  useEffect(() => {
    // This function will run when the component mounts
    const handleBackButton = () => {
      console.log("Browser back button clicked");
      socket.emit("disconnect", { roomId, userId });

      // Clean up game state
      setMessages([]);
      setJoinedUsers([]);
      setIsGameStarted(false);
      setCanDraw(false);
      setHasGuesed(false);
    };

    // Add listener for popstate (back/forward button) events
    window.addEventListener("popstate", handleBackButton);

    // Cleanup function to remove the listener when component unmounts
    return () => {
      window.removeEventListener("popstate", handleBackButton);

      // Also emit leaveRoom when component unmounts (e.g., direct navigation)
      socket.emit("leaveRoom", { roomId, userId });
    };
  }, [roomId, userId]);
  function startGame() {
    // console.log(roomData.id);

    socket.emit("startGame", { roomId });
  }
  function skipTurn() {
    socket.emit("skipTurn", { roomId });
  }
  function kickPlayer(playerId: any) {
    // console.log(roomId, playerId);
    // console.log(joinedUsers);

    socket.emit("kickPlayer", { roomId, playerId });
  }
  const sendMessage = (e: any) => {
    e.preventDefault();

    if (!hasGuesed && !canDraw) {
      console.log(`guess: ${message}`);

      socket.emit("guess", {
        roomId: roomId,
        guess: message,
        timeLeft: timeLeft,
      });
    }
    if (message.trim() && roomId) {
      const messageData: Message = { roomId, message, userName };
      // console.log(messageData);

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
    } else if (isGameStarted && timeLeft === 0) {
      switch (hasGuesed) {
        case true:
          const POSITIVE_HAND_FINISH_AUDIO = new Audio(Positive_Hand_Finish);
          POSITIVE_HAND_FINISH_AUDIO.play();
          break;
        case false:
          const NEGATIVE_HAND_FINISH_AUDIO = new Audio(Negative_Hand_Finish);
          NEGATIVE_HAND_FINISH_AUDIO.play();
          break;
      }
    }

    return () => clearInterval(timer); // Clean up the interval on component unmount
  }, [isGameStarted]);

  useEffect(() => {
    // Listen for messages
    socket.on("message", (message: RecivedMessage) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });
    socket.on("updateUserList", (data) => {
      // console.log(data);

      setJoinedUsers(data);
    });
    socket.on(
      "gameStarted",
      ({ currentDrawer, currentDrawerId, maxRounds }) => {
        setIsGameStarted(true);

        setCurrentDrawer(currentDrawer);
        setCurrentDrawerId(currentDrawerId);
        setMaxRounds(maxRounds);
      }
    );

    socket.on(
      "newDrawer",
      ({ currentDrawer, currentDrawerId, secretWord, time, currentRound }) => {
        // console.log("----gameroom-----");

        // console.log(currentDrawer);
        // console.log(currentDrawerId);
        // console.log("----gameroom-----");
        setCurrentRound(currentRound);
        // console.log(currentRound);
        setCurrentDrawerId(currentDrawerId);

        setTimeLeft(time);
        setCurrentDrawer(currentDrawer);
        setSecretWord(secretWord);
        setHasGuesed(false);
        setIsGamePaused(false);
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

    socket.on("correctGuess", (guesser) => {
      if (guesser.guesserId == userId) {
        setHasGuesed(true);
      }
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      const Correct_Guess_Audio = new Audio(Correct_Guess);
      Correct_Guess_Audio.play();
      socket.on("handEnded", (data) => {
        setCanDraw(false);
        setIsGamePaused(true);
        console.log(data);
      });
      joinedUsers[guesser.guesserId].hasGuessed = true;
      console.log(joinedUsers);
    });
    socket.on("MaxRoundsReached", () => {
      setIsGameStarted(false);
      const End_Of_Game_Audio = new Audio(End_Of_Game);
      End_Of_Game_Audio.play();
      console.log("MaxRoundsReached");
      // console.log(setIsGameStarted);
    });

    // Clean up when the component unmounts
    return () => {
      socket.off("message");
      socket.off("room_not_found");
      socket.off("room_not_exist");
      socket.off("updateUserList");
      socket.off("gameStarted");
      socket.off("newDrawer");
      socket.off("newWord");
    };
  }, [isGameStarted]);

  // const handleButtonClick = () => {};
  socket.on("SendCanvasDataToClient", (data) => {
    console.log(data);
    setIsGameStarted(true);
    setCurrentDrawer(data.currentDrawer);
    setCurrentDrawerId(data.currentDrawerId);
    setSecretWord(data.secretWord);
    setTimeLeft(data.time);
    setCurrentRound(data.currentRound);
    setMaxRounds(data.maxRounds);
  });
  return (
    <main className="font-ge-bold bg-no-repeat bg-cover lg:h-screen flex flex-col justify-center items-center h-[100svh] overflow-hidden">
      {" "}
      <div className="  lg:w-[80vw] lg:h-[95vh] flex lg:flex-row flex-col justify-center items-center lg:gap-1 lg:bg-bg-white  rounded-[5rem]">
        <div className=" bg-light-pink rounded-[2rem] ml-8 lg:block hidden  h-[90vh] w-[200px] 2xl:w-[320px] overflow-hidden  text-center">
          <p className="text-3xl whitespace-nowrap font-extrabold text-black inline-block pt-5">
            სასტავი:
          </p>
          {Object.values(joinedUsers)
            .sort((a, b) => b.score - a.score)
            .map((user: any, index: number) => (
              <div
                key={index}
                className={` flex flex-row justify-between items-center pl-2 ${
                  user.id == currentDrawerId
                    ? "bg-dark-purupe py-5"
                    : user.hasGuessed
                    ? "bg-green-600 py-5"
                    : "bg-light-purupe py-5"
                } text-lg `}
              >
                <p>#{index + 1}</p>
                <p>
                  {user.name}:{user.score}
                  {user.name == userName ? "(შენ)" : null}
                </p>
                {isAdmin ? (
                  <button
                    className="border-2 border-solid border-blue-900 bg-blue-700 w-[120px] h-[40px] text-md text-white rounded-[30px]"
                    onClick={() => {
                      kickPlayer(user.id);
                    }}
                  >
                    გააგდე
                  </button>
                ) : null}

                <hr />
              </div>
            ))}
        </div>
        {/* shuala plani */}

        <div className="  flex flex-col justify-center items-center">
          <div className="flex bg-light-pink lg:h-[70px] w-full  rounded-xl justify-between items-center px-5">
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

            {isGameStarted ? (
              <div className="flex  gap-3">
                <span className="bg-white font-bold text-3xl rounded-md h-[50px] w-[50px] flex items-center justify-center ">
                  {timeLeft}
                </span>
                <span className="bg-white font-bold text-2xl rounded-md flex items-center justify-center px-2">
                  რაუნდი - {currentRound}/{maxRounds}
                </span>
              </div>
            ) : null}

            {!isGamePaused && drawWord ? (
              <span className="text-black font-bold text-2xl">{drawWord}</span>
            ) : (
              <span className="text-black tracking-[0.2rem] font-bold">
                {!isGamePaused && secretWord + secretWord.length}
              </span>
            )}
            {isGameStarted && isAdmin ? (
              <>
                <button
                  className="border-2 border-solid border-blue-900 bg-blue-700 w-[120px] h-[40px] text-md text-white rounded-[30px]"
                  onClick={skipTurn}
                >
                  გადართე სვლა
                </button>
              </>
            ) : null}
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
              ? joinedUsers
                  .sort((a, b) => b.score - a.score)
                  .map((user: any, index: number) => (
                    <div key={index} className="flex flex-col break-words ">
                      <p
                        key={index}
                        className={` flex flex-row justify-between items-center  ${
                          user.id == currentDrawerId
                            ? "bg-dark-purupe py-1"
                            : user.hasGuessed
                            ? "bg-green-600 py-1"
                            : "bg-light-purupe py-1"
                        }  `}
                      >
                        {user.name}: {user.score}
                        {user.name == userName ? " (შენ)" : null}
                      </p>
                      <hr />
                    </div>
                  ))
              : null}
          </div>
          <div
            id="chat"
            className="flex flex-col lg:h-[90vh] justify-evenly items-center bg-light-pink lg:mr-8 rounded-[1rem] lg:rounded-[2rem] lg:w-[200px] 2xl:w-[320px] pb-5"
          >
            <span className="text-2xl">ჩათი</span>
            <div className="lg:w-[280px] w-[40vw] lg:h-[80vh] h-[30vh] flex items-center justify-evenly flex-col">
              <div className="bg-white lg:h-[80vh] h-[30vh] m-2 rounded-lg w-full flex flex-col overflow-hidden">
                <div className="overflow-y-auto h-full p-2 flex flex-col">
                  <div className="flex-grow"></div>
                  {messages.map((msg, index) => (
                    <div key={index}>
                      <p
                        className={`break-all ${
                          msg.userName === "game" ? "bg-green-600" : ""
                        }`}
                      >
                        {msg.userName === "game" ? null : msg.userName + ":"}
                        {msg.message}
                      </p>
                      <hr />
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <input
                  className="h-[35px] rounded-3xl text-center "
                  type="text"
                  placeholder="Enter message"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                  }}
                />
                <button type="submit" className="lg:block hidden">
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
