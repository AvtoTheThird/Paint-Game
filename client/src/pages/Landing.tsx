// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import socket from "../components/socket";
import { adjectives, nouns, premade } from "../components/words";
import Carousel from "../components/Carousel.tsx";
import Header from "../components/Header.tsx";
import Links from "../components/Links.tsx";
const Fimages = [
  "/avatars/F/F1",
  "/avatars/F/F2",
  "/avatars/F/F3",
  "/avatars/F/F4",
  "/avatars/F/F5",
  "/avatars/F/F6",
  "/avatars/F/F7",
  "/avatars/F/F8",
  "/avatars/F/F9",
  "/avatars/F/F10",
  "/avatars/F/F11",
  "/avatars/F/F12",
  "/avatars/F/F13",
  "/avatars/F/F14",
  "/avatars/F/F15",
  "/avatars/F/F16",
];
const Mimages = [
  "/avatars/M/M1",
  "/avatars/M/M2",
  "/avatars/M/M3",
  "/avatars/M/M4",
  "/avatars/M/M5",
  "/avatars/M/M6",
  "/avatars/M/M7",
  "/avatars/M/M8",
  "/avatars/M/M9",
  "/avatars/M/M10",
  "/avatars/M/M11",
  "/avatars/M/M12",
  "/avatars/M/M13",
  "/avatars/M/M14",
  "/avatars/M/M15",
  "/avatars/M/M16",
];
const LandingPage: React.FC = () => {
  // const [roomId, setRoomId] = useState("");
  const [currentImage, setCurrentImage] = useState("");
  // console.log(currentImage);

  interface dataToBeSent {
    roomId: string;
    userId: string;
    userName: string;
    isadmin: boolean;
    avatarID: string;
  }
  const [userName, setUserName] = useState<string>("");
  const [dataToBeSent, setDataToBeSent] = useState<dataToBeSent>({
    roomId: "",
    userId: "",
    userName: "",
    isadmin: false,
    avatarID: "",
  });
  // const [userId, setUserId] = useState<string>("");
  const navigate = useNavigate();
  socket.connected = true;
  function handleJoinPublicRoom() {
    // console.log(socket);

    socket.emit("join_public_room", {
      name: userName.length == 0 ? randomizeUserName() : userName,
      avatarID: currentImage,
    });
  }
  socket.on("joined_public_room", ({ roomId, roomName, userId, name }) => {
    // console.log(
    //   `Joined public room: (roomname: ${roomName} )(ID: ${roomId}) (userid: ${userId})`
    // );
    setDataToBeSent({
      roomId,
      userId,
      userName: name,
      isadmin: false,
      avatarID: currentImage,
      isPublic: true,
    });
  });
  useEffect(() => {
    console.log(dataToBeSent);
    if (dataToBeSent.roomId) {
      navigate(`/game-room/${dataToBeSent.roomId}`, {
        state: {
          ...dataToBeSent,
        },
      });
    }
  }, [dataToBeSent]);

  function randomizeUserName() {
    if (Math.random() < 0.1) {
      return premade[Math.floor(Math.random() * premade.length)];
    } else {
      return (
        adjectives[Math.floor(Math.random() * adjectives.length)] +
        "_" +
        nouns[Math.floor(Math.random() * nouns.length)]
      );
    }
  }
  function generateRandomizedUserName() {
    let randomizeduUserName = "";
    if (Math.random() < 0.1) {
      randomizeduUserName = premade[Math.floor(Math.random() * premade.length)];
    } else {
      randomizeduUserName =
        adjectives[Math.floor(Math.random() * adjectives.length)] +
        "_" +
        nouns[Math.floor(Math.random() * nouns.length)];
    }

    setUserName(randomizeduUserName);
  }
  const handleImageChange = (newImage, indexed) => {
    setCurrentImage(indexed);
  };
  console.log(currentImage);

  return (
    <main className="font-ge-bold  h-[100vh]  flex flex-col justify-start items-center ">
      <Header />
      <div className="xl:scale-75  2xl:scale-100 my-4 lg:my-0 text-center lg:w-[90vw] lg:h-[95vh] flex flex-col  justify-center items-center ">
        <div className="flex flex-col   justify-between  border-2 border-black bg-bg-pink w-[95vw] lg:w-[750px] lg:h-[550px]  rounded-3xl lg:p-10 xl:mt-[40px]  p-5  shadow-lg ">
          <div className="flex lg:flex-row flex-col w-full lg:justify-between  items-center gap-16">
            <Carousel
              Fimages={Fimages}
              Mimages={Mimages}
              onImageChange={handleImageChange}
            />

            <div className="flex flex-col  items-center gap-3">
              <button
                onClick={handleJoinPublicRoom}
                className=" border-solid bg-button-background-1 border-black border-[1px]  text-[48px]  p-3 m-2 text-white rounded-[30px] lg:w-[240px] lg:h-[100px]  drop-shadow-[-4px_4px_0_rgba(0,0,0,0.2)] text-shadow  transition transform active:scale-95 active:shadow-[inset_4px_4px_4px_rgba(0,0,0,0.4)] "
              >
                თამაში
              </button>
              <Link
                to="/join-room"
                state={
                  userName.length <= 0
                    ? {
                        userName: randomizeUserName(),
                        avatarID: currentImage,
                      }
                    : {
                        userName: userName,
                        avatarID: currentImage,
                      }
                }
                className="flex justify-center items-center border-solid bg-button-background-3 border-black border-[1px]  text-[36px]  leading-10  text-white rounded-[30px] lg:w-[260px] lg:h-[100px] drop-shadow-[-4px_4px_0_rgba(0,0,0,0.2)]  transition transform active:scale-95 active:shadow-[inset_4px_4px_4px_rgba(0,0,0,0.4)] "
              >
                <span className="text-white text-shadow ">
                  შეუერთდი მეგობრებს
                </span>
              </Link>
              <Link
                to="/create-room"
                state={
                  userName.length <= 0
                    ? {
                        userName: randomizeUserName(),
                        avatarID: currentImage,

                        // avatarID: currentImage.slice(10),
                      }
                    : {
                        userName: userName,
                        avatarID: currentImage,

                        // avatarID: currentImage.slice(10)
                      }
                }
                className=" border-solid bg-button-background-2 lg:p-0 p-3 border-black border-[1px]  text-[32px]  leading-8  text-white rounded-[30px] lg:w-[278px] lg:h-[100px] drop-shadow-[-4px_4px_0_rgba(0,0,0,0.2)]  transition transform active:scale-95 active:shadow-[inset_4px_4px_4px_rgba(0,0,0,0.4)]"
              >
                <span className="text-white text-shadow">
                  შექმენი სამეგობრო ოთახი
                </span>
              </Link>
            </div>
          </div>
          <div className=" flex flex-col lg:w-[250px] items-center w-full">
            <span className="text-white text-shadow text-2xl">
              თქვენი სახელი
            </span>
            <div className="relative">
              <input
                className=" h-[50px] border-[1px] border-solid border-black	rounded-[40px] w-[250px] placeholder:pl-2 pl-2 lg:text-lg"
                type="text"
                onChange={(e) => setUserName(e.target.value)}
                value={userName}
              />
              <button
                onClick={generateRandomizedUserName}
                type="button"
                className="absolute right-2 top-1/2 transform -translate-y-1/2  bg-blue-500 text-white px-2  rounded-md"
              >
                R
              </button>
            </div>
          </div>
        </div>
      </div>
      <Links />
    </main>
  );
};

export default LandingPage;
