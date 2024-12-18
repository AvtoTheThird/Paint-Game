// @ts-nocheck
import Canvas from "../components/Canvas";
import socket from "../components/socket";
import confetti from "canvas-confetti";
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

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
  // const [roomName, setRoomName] = useState<string>("");
  const [drawWord, setDrawWord] = useState<never>();
  const [userId, setUserId] = useState<string>("");
  const [canDraw, setCanDraw] = useState<boolean>(false);
  const [hasGuesed, setHasGuesed] = useState<boolean>(false);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [secretWord, setSecretWord] = useState<string>("");
  const [currentDrawer, setCurrentDrawer] = useState<string>("");
  const [currentDrawerId, setCurrentDrawerId] = useState<string>("");
  const [currentRound, setCurrentRound] = useState<number>();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isGamePaused, setIsGamePaused] = useState<boolean>(false);
  const [maxRounds, setMaxRounds] = useState<number>();
  const [avatarID, setAvatarID] = useState<string>("/avatars/1-1.svg");
  const [isPublic, setIsPublic] = useState<boolean>();
  const [guessedWord, setGuessedWord] = useState<string>("");
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
    setAvatarID(location.state.avatarID);
    setIsPublic(location.state.isPublic);
  }, [location]);
  // console.log(avatarID);
  console.log(location.state);

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
  function kickPlayer(playerId: string) {
    // console.log(roomId, playerId);
    // console.log(joinedUsers);

    socket.emit("kickPlayer", { roomId, playerId });
  }
  const sendMessage = (e: Event) => {
    e.preventDefault();

    if (hasGuesed && message === guessedWord) {
      setMessage("");
      return;
    }
    if (!hasGuesed && !canDraw) {
      console.log(`guess: ${message}`);

      socket.emit("guess", {
        roomId: roomId,
        guess: message,
        timeLeft: timeLeft,
      });
      setMessage("");

      return;
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
    let timer: number | undefined;
    console.log(hasGuesed);
    if (isGameStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (isGameStarted && timeLeft === 0) {
      switch (hasGuesed) {
        case true: {
          const POSITIVE_HAND_FINISH_AUDIO = new Audio(Positive_Hand_Finish);
          POSITIVE_HAND_FINISH_AUDIO.play().catch((err) => console.log(err));
          POSITIVE_HAND_FINISH_AUDIO.onended = () => {
            POSITIVE_HAND_FINISH_AUDIO.remove();
          };
          break;
        }
        case false: {
          const NEGATIVE_HAND_FINISH_AUDIO = new Audio(Negative_Hand_Finish);
          NEGATIVE_HAND_FINISH_AUDIO.play().catch((err) => console.log(err));
          NEGATIVE_HAND_FINISH_AUDIO.onended = () => {
            NEGATIVE_HAND_FINISH_AUDIO.remove();
          };
        }
      }
    }
    // console.log(hasGuesed)

    return () => clearInterval(timer); // Clean up the interval on component unmount
  }, [hasGuesed, isGameStarted, timeLeft]);

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

    socket.on("correctGuess", ({ guesser, guesserId, word }) => {
      if (guesserId === userId) {
        setHasGuesed(true);
      }

      console.log(guesser, guesserId, word);
      setGuessedWord(word);
      // confetti({
      //   particleCount: 100,
      //   spread: 70,
      //   origin: { y: 0.6 },
      // });
      const Correct_Guess_Audio = new Audio(Correct_Guess);
      Correct_Guess_Audio.play().catch((err) => console.log(err));
      Correct_Guess_Audio.onended = () => {
        Correct_Guess_Audio.remove();
      };

      setJoinedUsers((prevUsers) => {
        const updatedUsers = { ...prevUsers };
        if (updatedUsers[guesser.guesserId])
          updatedUsers[guesser.guesserId] = {
            ...updatedUsers[guesser.guesserId],
            hasGuessed: true,
          };
        return updatedUsers;
      });
    });
    socket.on("MaxRoundsReached", () => {
      setIsGameStarted(false);
      const End_Of_Game_Audio = new Audio(End_Of_Game);
      End_Of_Game_Audio.play().catch((err) => console.log(err));
      End_Of_Game_Audio.onended = () => {
        End_Of_Game_Audio.remove();
      };
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
  }, [isGameStarted, socket, userId]);

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
  console.log(joinedUsers);

  return (
    <main className="font-ge-bold  lg:h-screen flex flex-col justify-center items-center h-[100svh] overflow-hidden">
      {" "}
      <header className="group fixed top-0 w-full z-50 h-[80px] bg-gradient-to-b from-black/50 to-transparent  hover:h-[150px] hover:top-[-15px]  text-xl transition-all duration-200 ease-in-out  ">
        <div className="container mx-auto    h-full flex items-center justify-evenly">
          <div className="lg:w-1/3 lg:block hidden"></div>
          <a
            href="#home"
            className="block lg:hidden text-white text-sm hover:text-pink group-hover:text-xl   transition-all duration-200 ease-in-out"
          >
            წესები
          </a>
          <div className="flex items-center">
            <Link to="/">
              <img
                src="/xelovniki.png"
                alt="Logo"
                className="w-[110px] group-hover:w-[200px] transition-all duration-200 ease-in-out  "
              />
            </Link>
          </div>
          <div className="lg:w-1/3 flex justify-end items-center space-x-4 gap-16 pt-3 ">
            <a
              href="#home"
              className="hidden lg:block text-white text-sm hover:text-pink group-hover:text-xl   transition-all duration-200 ease-in-out"
            >
              თამაშის წესები
            </a>
            <a
              href="#about"
              className="text-white text-sm hover:text-pink group-hover:text-xl  transition-all duration-200 ease-in-out"
            >
              კონტაქტი
            </a>
          </div>
        </div>
      </header>
      <div className="  lg:w-[100vw] lg:h-[760px] flex lg:flex-row flex-col justify-center items-center lg:gap-1 lg:bg-bg-white lg:mt-16 mt-0 ">
        <div className=" bg-light-pink rounded-md ml-8 lg:block hidden  h-[680px] w-[300px] 2xl:w-[320px] overflow-hidden  text-center mb-auto mt-2">
          <p className="text-3xl whitespace-nowrap font-extrabold text-black inline-block pt-5">
            სასტავი:
          </p>
          {Object.values(joinedUsers)
            .sort((a, b) => b.score - a.score)
            .map((user: any, index: number) => (
              <div
                key={index}
                className={`relative group flex flex-row justify-start gap-2 items-center pl-2 m-2 rounded-md py-2 ${
                  user.id == currentDrawerId
                    ? "bg-dark-purupe"
                    : user.hasGuessed
                    ? "bg-green-600"
                    : "bg-white "
                } text-lg `}
              >
                <img
                  className="w-[65px] h-[65px] bg-slate-300 rounded-md border-gray-500 border-[1px] "
                  src={`${user.avatarID}.svg`}
                  alt={".."}
                />
                {/* public/avatars/F/F10.svg */}
                <div className="flex flex-col justify-start items-start ">
                  <p className="text-base">
                    {user.name}
                    {user.name == userName ? "(შენ)" : null}
                  </p>{" "}
                  <p className="text-sm text-light-pink"> ქულა: {user.score}</p>
                  <p className="text-sm ">#{index + 1}</p>
                </div>
                {isAdmin ? (
                  <button
                    className="absolute bottom-2 right-2"
                    onClick={() => {
                      kickPlayer(user.id);
                    }}
                  >
                    <img
                      className="w-[35px] h-[35px] opacity-25 group-hover:opacity-100 transition-all duration-200 ease-in-out"
                      src="/kick.png"
                      alt="გააგდე"
                      title="გააგდე"
                    />
                  </button>
                ) : null}
                <hr />
              </div>
            ))}
        </div>
        {/* shuala plani */}

        <div className="  flex flex-col justify-center items-center mb-auto mt-2">
          <div className="flex bg-white lg:h-[74px] w-full  rounded-xl justify-between items-center px-5">
            {isGameStarted ? (
              <div className="flex  gap-3">
                <span className="bg-light-pink font-bold text-3xl rounded-md h-[50px] w-[50px] flex items-center justify-center ">
                  {timeLeft}
                </span>
                <span className="bg-light-pink font-bold text-2xl rounded-md flex items-center justify-center px-2">
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
            {!isGameStarted && location.state.isAdmin ? (
              <button
                onClick={() => {
                  startGame();
                }}
                className="  bg-light-pink w-[50px] h-[50px] text-md text-white rounded-sm "
              >
                <img
                  alt="დაიწყე თამაში"
                  width="30px"
                  src="/start.png"
                  className="m-auto"
                  title="დაიწყე თამაში"
                />
              </button>
            ) : null}
            {isGameStarted && isAdmin ? (
              <>
                <button
                  className="bg-light-pink w-[50px] h-[50px] text-md text-white rounded-sm"
                  onClick={skipTurn}
                >
                  <img
                    alt="გადართე სვლა"
                    width="30px"
                    src="/skip.png"
                    className="m-auto"
                    title="გადართე სვლა"
                  />
                </button>
              </>
            ) : null}
          </div>

          <div className="w-full max-w-screen-lg mx-auto">
            <Canvas canvasData={canvasData} />
          </div>
        </div>

        <div className="flex justify-between gap-3 mb-auto mt-2 ">
          {" "}
          <div className="flex-grow  overflow-y-scroll bg-light-pink rounded-[1rem] lg:rounded-[5rem]   lg:h-[90vh] w-[40vw] overflow-hidden  text-center lg:hidden">
            <p className="text-3xl whitespace-nowrap font-extrabold text-black inline-block pt-5">
              სასტავი:
            </p>
            {Object.values(joinedUsers)
              .sort((a, b) => b.score - a.score)
              .map((user: any, index: number) => (
                <div
                  key={index}
                  className={`relative group items-center pl-2 m-2 rounded-md py-2 ${
                    user.id == currentDrawerId
                      ? "bg-dark-purupe"
                      : user.hasGuessed
                      ? "bg-green-600"
                      : "bg-white "
                  } text-lg `}
                >
                  <p className="text-base">
                    {user.name}
                    {user.name == userName ? "(შენ)" : null}
                  </p>

                  <div className="flex  justify-start items-start ">
                    <img
                      className="w-[40px] h-[40px] bg-slate-300 rounded-md border-gray-500 border-[1px] "
                      src={`${user.avatarID}.svg`}
                      alt={".."}
                    />{" "}
                    <div className="flex flex-col justify-start items-start pl-2">
                      {" "}
                      <p className="text-sm text-light-pink">
                        {" "}
                        ქულა: {user.score}
                      </p>
                      <p className="text-sm ">#{index + 1}</p>
                    </div>
                  </div>

                  {isAdmin ? (
                    <button
                      className="absolute bottom-2 right-2"
                      onClick={() => {
                        kickPlayer(user.id);
                      }}
                    >
                      <img
                        className="w-[35px] h-[35px] opacity-25 group-hover:opacity-100 transition-all duration-200 ease-in-out"
                        src="/kick.png"
                        alt="გააგდე"
                        title="გააგდე"
                      />
                    </button>
                  ) : null}
                </div>
              ))}
          </div>
          <div
            id="chat"
            className="flex-grow lg:flex-grow-0 flex flex-col lg:h-[682px] lg:w-[300px] justify-evenly items-center bg-light-pink lg:mr-8 rounded-md  2xl:w-[320px] pb-5 "
          >
            <div className="lg:w-[280px] w-[40vw] lg:h-[80vh] h-[30vh] flex items-center justify-evenly flex-col">
              <img
                width={"40px"}
                className="ml-auto"
                src="/back.png"
                alt={".."}
              />

              <div className="bg-white lg:h-[561px] w-full lg:w-[295px] h-[30vh] m-2 rounded-md  flex flex-col overflow-hidden">
                <div className="overflow-y-auto h-full p-2 flex flex-col">
                  <div className="flex-grow"></div>
                  {messages.map((msg, index) => (
                    <div key={index}>
                      <p
                        className={`text-sm break-all ${
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
              <form
                onSubmit={sendMessage}
                className="flex items-center gap-2"
                class="wrap"
              >
                <input
                  className="h-[35px] w-[140px] lg:w-[295px] rounded-md text-center "
                  type="text"
                  // placeholder="Enter message"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                  }}
                />
                <button type="submit" className="" class="button">
                  <img src="/send.png" alt="" />
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
