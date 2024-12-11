// @ts-nocheck
import socket from "../components/socket";
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface Message {
  roomId: string;
  message: string;
  userName: string;
}
interface RecivedMessage {
  message: string;
  userName: string;
}

function Chat() {
  const [message, setMessage] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [messages, setMessages] = useState<RecivedMessage[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [hasGuesed, setHasGuesed] = useState<boolean>(false);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [currentDrawer, setCurrentDrawer] = useState<string>("");
  const [currentDrawerId, setCurrentDrawerId] = useState<string>("");
  const [isPublic, setIsPublic] = useState<boolean>();
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
    setUserId(location.state.userId);
    setUserName(location.state.userName);
    setIsPublic(location.state.isPublic);
  }, [location]);

  const sendMessage = (e: Event) => {
    console.log(message);

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
  //   console.log(canvasData);

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
      Correct_Guess_Audio.play().catch((err) => console.log(err));
      Correct_Guess_Audio.onended = () => {
        Correct_Guess_Audio.remove();
      };
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
      socket.off("newDrawer");
      socket.off("newWord");
    };
  }, [isGameStarted]);

  // const handleButtonClick = () => {};

  return (
    <div
      id="chat"
      className="flex flex-col lg:h-[682px] lg:w-[300px] justify-evenly items-center bg-light-pink lg:mr-8 rounded-md  2xl:w-[320px] pb-5 "
    >
      <div className="lg:w-[280px] w-[40vw] lg:h-[80vh] h-[30vh] flex items-center justify-evenly flex-col">
        <img width={"40px"} className="ml-auto" src="/back.png" alt={".."} />

        <div className="bg-white lg:h-[561px] w-[140px] lg:w-[295px] h-[30vh] m-2 rounded-md  flex flex-col overflow-hidden">
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
        <form
          onSubmit={sendMessage}
          className="flex items-center gap-2"
          class="wrap"
        >
          <input
            className="h-[35px] w-[140px] lg:w-[295px] rounded-md text-center "
            type="text"
            placeholder="Enter message"
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
  );
}

export default Chat;
