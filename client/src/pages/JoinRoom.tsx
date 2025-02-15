import React, { useEffect, useState } from "react";
import socket from "../components/socket";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Header from "../components/Header.tsx";
import Links from "../components/Links.tsx";
// import { nouns, adjectives } from "../components/words";

function CreateRoom() {
  const [roomId, setRoomId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [roomData, setRoomData] = useState<any>({});
  const [avatarID, setAvatarID] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    setUserName(location.state.userName);
    setAvatarID(location.state.avatarID);
  }, []);
  console.log(avatarID);

  const joinRoom = () => {
    console.log("join room handler");

    if (roomId.trim()) {
      const dataToBeSent = { roomId, name: userName, avatarID };
      // console.log("data to be sent", dataToBeSent);
      socket.emit("join_room", dataToBeSent);
      socket.on("roomError", (data) => {
        alert(data.error);

        return;
      });

      socket.on("userJoined", (data) => {
        console.log(data);
        setUserId(data.id);
        setRoomData({ ...roomData, id: data.roomId });
      });
      // console.log(roomData);
      console.log(dataToBeSent);
    }
  };
  const goBack = () => {
    navigate("/");
  };
  useEffect(() => {
    // console.log(roomData);
    if (roomData.id) {
      navigate(`/game-room/${roomData.roomId}`, {
        state: {
          roomId: roomData.id,
          userId: userId,
          userName: userName,
          isAdmin: false,
          avatarID,
        },
      });
    }
  }, [roomData]);

  return (
    <main className="font-ge-bold   lg:h-screen flex flex-col justify-center items-center h-[100svh]">
      <Header />

      <div className="h-[100svh]  lg:w-[90vw] lg:h-[95vh] flex flex-col  justify-center items-center  ">
        <div className="xl:scale-90 2xl:scale-100 relative flex flex-col  border-2 border-black  items-center justify-between bg-bg-pink w-[95vw] lg:w-[750px] lg:h-[550px]   rounded-3xl lg:p-10  p-5 ">
          <div className="absolute w-3.5 h-3.5 bg-white rounded-full top-4 left-4 border-[1px] border-black "></div>
          <div className="absolute w-3.5 h-3.5 bg-white rounded-full top-4 right-4 border-[1px] border-black "></div>
          <div className="absolute w-3.5 h-3.5 bg-white rounded-full bottom-4 right-4 border-[1px] border-black "></div>
          <div className="absolute w-3.5 h-3.5 bg-white rounded-full bottom-4 left-4 border-[1px] border-black "></div>
          <div className="lg:flex flex-col gap-5 items-center justify-between pb-3 lg:w-[600px]">
            <p className="text-[40px] whitespace-nowrap font-extrabold text-white">
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
          <div className="flex gap-10">
            <button
              className=" border-solid bg-button-background-1 border-black border-[1px]  text-[36px]   text-white rounded-[30px] lg:w-[200px] lg:h-[80px]  drop-shadow-[-4px_4px_0_rgba(0,0,0,0.2)] transition transform active:scale-95 active:shadow-[inset_4px_4px_4px_rgba(0,0,0,0.4)]"
              onClick={goBack}
            >
              უკან
            </button>
            <button
              className=" border-solid bg-button-background-1 border-black border-[1px]  text-[36px]   text-white rounded-[30px] lg:w-[200px] lg:h-[80px]  drop-shadow-[-4px_4px_0_rgba(0,0,0,0.2)] transition transform active:scale-95 active:shadow-[inset_4px_4px_4px_rgba(0,0,0,0.4)]"
              onClick={joinRoom}
            >
              თამაში
            </button>
          </div>
        </div>
      </div>
      <Links />
    </main>
  );
}

export default CreateRoom;
