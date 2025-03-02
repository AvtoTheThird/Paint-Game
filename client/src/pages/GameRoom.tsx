// @ts-nocheck
import Canvas from "../components/Canvas";
import socket from "../components/socket";
import confetti from "canvas-confetti";
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Links from "../components/Links";

import EndOFGameScreen from "../components/EndOfGameScreen";

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
  const [drawWord, setDrawWord] = useState<never>();
  const [userId, setUserId] = useState<string>("");
  const [canDraw, setCanDraw] = useState<boolean>(false);
  const [hasGuesed, setHasGuesed] = useState<boolean>(false);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [secretWord, setSecretWord] = useState<string>("");
  const [currentDrawer, setCurrentDrawer] = useState<string>("");
  const [currentDrawerId, setCurrentDrawerId] = useState<string>("");
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isGamePaused, setIsGamePaused] = useState<boolean>(false);
  const [maxRounds, setMaxRounds] = useState<number>(0);
  const [avatarID, setAvatarID] = useState<string>("/avatars/1-1.svg");
  const [isPublic, setIsPublic] = useState<boolean>();
  const [guessedWord, setGuessedWord] = useState<string>("");
  const [maxRoundsReached, setMaxRoundsReached] = useState<boolean>(false);

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

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
  // console.log(location.state);

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
    socket.emit("kickPlayer", { roomId, playerId });
  }
  const sendMessage = (e: Event) => {
    e.preventDefault();
    if (message.trim() === "") return;
    if (hasGuesed && message.replace(/\s/g, "") === guessedWord) {
      setMessage("");
      return;
    }

    if (canDraw && message === drawWord) {
      interface Message {
        roomId: string;
        message: string;
        userName: string;
      }

      setMessages((prevMessages) => [
        ...prevMessages,
        { roomid: roomId, message: "ნუ კარნახობ", userName: "code1" },
      ]);

      setMessage("");
      return;
    }

    if (!hasGuesed && !canDraw) {
      // console.log(`guess: ${message}`);
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
      return;
    }

    // console.log(roomData);
  };
  const canvasData = { roomId, userId };
  //   console.log(canvasData);

  useEffect(() => {
    let timer: number | undefined;
    // console.log(hasGuesed);
    if (isGameStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
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
      ({ currentDrawer, currentDrawerId, maxRounds, time }) => {
        setMaxRoundsReached(false);
        setMaxRounds(maxRounds);
        setIsGameStarted(true);
        setTimeLeft(time);
        setCurrentDrawer(currentDrawer);
        setCurrentDrawerId(currentDrawerId);
        if (currentDrawerId == location.state.userId) {
          setCanDraw(true);
        }
      }
    );

    socket.on(
      "newDrawer",
      ({ currentDrawer, currentDrawerId, secretWord, time, currentRound }) => {
        setCurrentRound(currentRound);
        setCurrentDrawerId(currentDrawerId);

        setTimeLeft(time);
        setCurrentDrawer(currentDrawer);
        setSecretWord(secretWord);
        setHasGuesed(false);
        setIsGamePaused(false);

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
    socket.on("youWereKicked", () => {
      navigate("/", { replace: true });
      window.location.reload();
    });
    socket.on("correctGuess", ({ guesser, guesserId, word }) => {
      if (guesserId === userId) {
        setHasGuesed(true);
      }

      // console.log(guesser, guesserId, word);
      setGuessedWord(word);
      // confetti({
      //   particleCount: 100,
      //   spread: 70,
      //   origin: { y: 0.6 },
      // });

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
      setMaxRoundsReached(true);

      setIsGameStarted(false);

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
    // console.log(data);
    setIsGameStarted(true);
    setCurrentDrawer(data.currentDrawer);
    setCurrentDrawerId(data.currentDrawerId);
    setSecretWord(data.secretWord);
    setTimeLeft(data.time);
    setCurrentRound(data.currentRound);
    setMaxRounds(data.maxRounds);
  });
  // console.log(joinedUsers);
  const EndOFGameScreenData = joinedUsers;

  return (
    <>
      {" "}
      <header className=" font-ge-bold group fixed top-0 w-full z-50 h-[80px] bg-gradient-to-b from-black/50 to-transparent  hover:h-[150px] hover:top-[-15px]  text-xl transition-all duration-200 ease-in-out  ">
        <div className="container mx-auto h-full flex items-center justify-evenly">
          <div className="lg:w-1/3 lg:block hidden"></div>
          <Link
            to="/rules"
            className="block lg:hidden text-white text-sm hover:text-pink group-hover:text-xl   transition-all duration-200 ease-in-out"
          >
            წესები
          </Link>
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
            <Link
              to="/rules"
              className="text-white hover:text-pink lg:text-xl text-sm transition-all duration-200 ease-in-out"
            >
              თამაშის წესები
            </Link>

            <Link
              to="/contact"
              className="text-white hover:text-pink lg:text-xl text-sm transition-all duration-200 ease-in-out"
            >
              კონტაქტი
            </Link>
          </div>
        </div>
      </header>
      <main className="font-ge-bold  lg:h-screen flex flex-col justify-center items-center h-[100svh] overflow-hidden relative">
        <div className="  lg:w-[100vw] 2xl:h-[760px] xl:h-[550px] flex lg:flex-row flex-col justify-center items-center lg:gap-1 lg:bg-bg-white lg:mt-16 xl:mt-16 mt-0 ">
          <div className="  bg-light-pink border-gray border-[1px] rounded-[3px] ml-8 lg:block hidden 2xl:h-[679px] xl:h-[484px] lg:w-[300px] 2xl:w-[320px]   text-center mb-auto mt-2">
            {Object.values(joinedUsers)
              .sort((a, b) => b.score - a.score)
              .map((user: any, index: number) => (
                <div
                  key={index}
                  className={`relative group flex flex-row justify-start gap-2 items-center pl-2 m-2 rounded-[3px] py-2 ${
                    user.id == currentDrawerId
                      ? "bg-dark-purupe"
                      : user.hasGuessed
                      ? "bg-green-600"
                      : "bg-gray-100 "
                  } text-lg `}
                >
                  <img
                    className="w-[65px] h-[65px] bg-slate-300 rounded-[3px] border-gray-500 border-[1px]"
                    src={`${user.avatarID}.svg`}
                    alt="User Avatar"
                  />
                  <div className="flex flex-col justify-start items-start">
                    <p className="text-base">
                      {user.name}
                      {user.name == userName ? "(შენ)" : null}
                    </p>
                    <p className="text-sm text-light-pink">
                      ქულა: {user.score}
                    </p>
                    <p className="text-sm">#{index + 1}</p>
                  </div>
                  {isAdmin ? (
                    <button
                      className="absolute bottom-2 right-2"
                      onClick={() => kickPlayer(user.id)}
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
          {/* shuala plani */}

          <div className="  flex flex-col justify-center items-center mb-auto mt-2  gap-1">
            <div className="flex bg-white 2xl:h-[74px] xl:h-[55px] w-full  rounded-[3px] justify-between items-center px-5  border-[1px] border-gray">
              {isGameStarted ? (
                <div className="flex  gap-3">
                  <span className="bg-light-pink font-bold text-3xl rounded-[5px] h-[50px] w-[50px] flex items-center justify-center text-white text-shadow ">
                    {timeLeft}
                  </span>
                  <span className="bg-light-pink font-bold text-white  text-2xl rounded-[5px] flex items-center justify-center px-2  text-shadow   ">
                    რაუნდი - {currentRound + 1}/{maxRounds}
                  </span>
                </div>
              ) : null}

              {!isGamePaused && drawWord ? (
                <span className="text-black font-bold text-2xl">
                  {drawWord}
                </span>
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
                  className="  bg-light-pink w-[50px] h-[50px] text-md text-white rounded-[5px] border-[1px] border-gray"
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
                    className="bg-light-pink w-[50px] h-[50px] text-md text-white rounded-[5px] border-[1px] border-gray"
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

            <div className="w-full max-w-screen-lg mx-auto relative xl:w-[566px] 2xl:w-[800px]">
              <Canvas canvasData={canvasData} />
              {maxRoundsReached ? (
                <EndOFGameScreen endOFGameScreenData={EndOFGameScreenData} />
              ) : null}
            </div>
          </div>

          <div className="flex justify-between gap-3 mb-auto mt-2 w-[97vw] sm:w-auto ">
            <div className="flex-grow  overflow-y-scroll bg-light-pink rounded-[3px]   lg:h-[90vh] w-[40vw]   text-center lg:hidden border-gray border-[1px] ">
              {Object.values(joinedUsers)
                .sort((a, b) => b.score - a.score)
                .map((user: any, index: number) => (
                  <div
                    key={index}
                    className={`relative group flex flex-col items-center justify-center pl-2 m-2 rounded-[3px] py-2 ${
                      user.id == currentDrawerId
                        ? "bg-dark-purupe"
                        : user.hasGuessed
                        ? "bg-green-600"
                        : "bg-white "
                    } text-lg `}
                  >
                    <p className="text-sm">
                      {user.name}
                      {user.name == userName ? "(შენ)" : null}
                    </p>

                    <div className="flex  justify-start items-start ">
                      <img
                        className="w-[40px] h-[40px] bg-slate-300 rounded-[3px] border-gray-500 border-[1px] "
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
              className=" flex-grow lg:flex-grow-0 flex flex-col 2xl:h-[679px] xl:h-[484px] lg:w-[300px] justify-evenly items-center bg-light-pink border-gray border-[1px] lg:mr-8 rounded-[3px]  2xl:w-[320px] pb-5 "
            >
              <div className="lg:w-[280px] w-[40vw] 2xl:h-[597px] lg:h-[550px] h-[30vh] flex items-center  flex-col">
                <img
                  width={"40px"}
                  className="ml-auto"
                  src="/back.png"
                  alt={".."}
                />

                <div className="bg-white border-gray border-[1px] 2xl:h-[600px] xl:h-[380px]  lg:w-[295px] h-[30vh] m-2 rounded-[3px] w-[98%] flex flex-col overflow-hidden">
                  <div
                    className="overflow-y-auto h-full p-2 flex flex-col "
                    id="style-2"
                  >
                    <div className="flex-grow"></div>
                    {messages.map((msg, index) => (
                      <div key={index}>
                        <p
                          className={`text-sm break-all ${
                            msg.userName === "game"
                              ? "bg-green-600"
                              : msg.userName === "code1"
                              ? "bg-red-600"
                              : ""
                          }`}
                        >
                          {msg.userName === "game"
                            ? null
                            : msg.userName === "code1"
                            ? null
                            : `${msg.userName}: `}
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
                    className="h-[35px] w-[140px] lg:w-[295px] rounded-[3px] text-center "
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
        <div className="fixed bottom-2 left-2 bg-black bg-opacity-70 text-white text-sm px-3 py-1 rounded z-50">
          პაროლი: <span className="text-light-pink">{roomId}</span>
        </div>
        <Links />
      </main>
    </>
  );
}

export default GameRoom;
