// @ts-nocheck
import React, {useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import socket from "../components/socket";
import {adjectives, nouns} from "../components/words";
import Carousel from "../components/Carousel.tsx";
import Header from "../components/Header.tsx";
const images = [
  "./avatars/1-1.svg",
  "./avatars/10-A.svg",
  "./avatars/2-A.svg",
  "./avatars/3-A.svg",
  "./avatars/4-A.svg",
  "./avatars/5-A.svg",
  "./avatars/6-A.svg",
  "./avatars/7-A.svg",
  "./avatars/8-A.svg",
  "./avatars/9-A.svg",
  "./avatars/AF1.svg",
  "./avatars/AF2.svg",
  "./avatars/AF3.svg",
  "./avatars/AF4.svg",
  "./avatars/AF5.svg",
  "./avatars/AVTO-A.svg",
  "./avatars/D-A.svg",
  "./avatars/F1.svg",
  "./avatars/F2.svg",
  "./avatars/F3.svg",
  "./avatars/F4.svg",
  "./avatars/F5.svg",
  "./avatars/F6.svg",
  "./avatars/F7.svg",
  "./avatars/F8.svg",
  "./avatars/F9.svg",
  "./avatars/JOLO-A.svg",
  "./avatars/L1.svg",
  "./avatars/L4.svg",
  "./avatars/PEWI-A.svg",
  "./avatars/Sleepyjoe-A.svg",
  "./avatars/Trump-A.svg"
];
const LandingPage: React.FC = () => {
  // const [roomId, setRoomId] = useState("");
  const [currentImage, setCurrentImage] = useState(images[0]);
  console.log(currentImage.slice(10))
  interface dataToBeSent {
  roomId: string;
  userId: string;
  userName: string;
  isadmin: boolean;
  avatarID: string
}
  const [userName, setUserName] = useState<string>("");
  const [dataToBeSent, setDataToBeSent] = useState<dataToBeSent>({
    roomId: "",
    userId: "",
    userName: "",
    isadmin: false,
    avatarID: ""
  });
  // const [userId, setUserId] = useState<string>("");
  const navigate = useNavigate();
  socket.connected = true;
  function handleJoinPublicRoom() {
    // console.log(socket);

    socket.emit("join_public_room", {
      name: userName.length == 0 ? randomizeUserName() : userName, avatarID:currentImage.slice(10)
    });
  }
  socket.on("joined_public_room", ({ roomId, roomName, userId, name }) => {
    console.log(
      `Joined public room: (roomname: ${roomName} )(ID: ${roomId}) (userid: ${userId})`
    );
    setDataToBeSent({
      roomId,
      userId,
      userName: name,
      isadmin: false,
      avatarID: currentImage.slice(10),
      isPublic:true
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
    return adjectives[Math.floor(Math.random() * adjectives.length)] +
        "_" +
        nouns[Math.floor(Math.random() * nouns.length)];
  }
  function generateRandomizedUserName() {
    let randomizeduUserName = "";
    randomizeduUserName =
      adjectives[Math.floor(Math.random() * adjectives.length)] +
      "_" +
      nouns[Math.floor(Math.random() * nouns.length)];
    setUserName(randomizeduUserName);
  }
  const handleImageChange = (newImage) => {
    setCurrentImage(newImage);
  };
  return (
    <main className="font-ge-bold   lg:h-screen flex flex-col justify-center items-center ">
     <Header/>
      <div className="my-4 lg:my-0 text-center lg:w-[90vw] lg:h-[95vh] flex flex-col  justify-center items-center ">

        {/* <div className=" relative flex flex-col border-[2px] border-red-600 border-dotted  items-center justify-between bg-bg-pink w-[95vw] lg:w-[780px] lg:h-[580px]   rounded-3xl lg:p-10  p-5 shadow-[-5px_5px_0px_0px_rgba(109,40,217)]"> */}

        <div
            className="flex flex-col   justify-between bg-bg-pink-opacity border-2 border-black lg:bg-bg-pink w-[95vw] lg:w-[750px] lg:h-[550px]   rounded-3xl lg:p-10  p-5  shadow-lg ">

          <div className="flex lg:flex-row flex-col w-full lg:justify-between  items-center">
            {/*<div className="w-[250px] h-[337px] bg-white rounded-lg"></div>*/}
            <Carousel images={images} onImageChange={handleImageChange} />
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
                    ? { userName: randomizeUserName(),avatarID:currentImage.slice(10) }
                    : { userName: userName,avatarID:currentImage.slice(10)}
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
                    ? { userName: randomizeUserName(),avatarID:currentImage.slice(10) }
                    : { userName: userName,avatarID:currentImage.slice(10) }
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
    </main>
  );
};

export default LandingPage;
