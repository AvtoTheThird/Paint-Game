import React, { useEffect, useState } from "react";
import socket from "../components/socket";
import { useNavigate, useLocation } from "react-router-dom";
// import { nouns, adjectives } from "../components/words";

function CreateRoom() {
  const [roomId, setRoomId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [roomData, setRoomData] = useState<any>({});
  const [avatarID, setAvatarID]= useState<string>("");
  const [roomName, setRoomName] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    setUserName(location.state.userName);
    setAvatarID(location.state.avatarID)
  }, []);
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
        setRoomName(data.roomName);
        setRoomData({ ...roomData, id: data.roomId });
      });
      // console.log(roomData);
      console.log(dataToBeSent)

    }
    // navigate(`/game-room/${roomData.roomId}`)

  };
  useEffect(() => {
    if (roomData.id) {
      navigate(`/game-room/${roomData.roomId}`, {
        state: {
          roomId: roomData.id,
          userId: userId,
          userName: userName,
          isAdmin: false,
          avatarID
        },
      });
    }
  }, [roomData]);
  //  function randomizeUserName() {
  //   let password = "";
  //   console.log("randomizePassword");

  //   password += nouns[Math.floor(Math.random() * nouns.length)];
  //   password += adjectives[Math.floor(Math.random() * adjectives.length)];
  //   console.log(password);

  //   setRoomData({ ...roomData, id: password });
  //   console.log(roomData);
  // }
  return (
    <main className="font-ge-bold bg-no-repeat bg-cover lg:h-screen flex flex-col justify-center items-center h-[100svh]">
      <div className="h-[100svh]  lg:w-[90vw] lg:h-[95vh] flex flex-col  justify-center items-center  bg-bg-white  rounded-[5rem]">
        <h1 className="text-4xl font-bold mb-8 ">Firo$ Money</h1>
        <div className=" relative flex flex-col border-[2px] border-red-600 border-dotted  items-center justify-between bg-bg-pink w-[95vw] lg:w-[780px] lg:h-[580px]   rounded-3xl lg:p-10  p-5 shadow-[-5px_5px_3px_0px_rgba(109,40,217)]">
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
          <button
            className=" border-solid bg-button-background-1 border-black border-[1px]  text-[36px]   text-white rounded-[30px] lg:w-[200px] lg:h-[80px]  drop-shadow-[-4px_4px_0_rgba(0,0,0,0.2)] transition transform active:scale-95 active:shadow-[inset_4px_4px_4px_rgba(0,0,0,0.4)]"
            onClick={joinRoom}
          >
            თამაში
          </button>
        </div>
      </div>
    </main>
  );
}

export default CreateRoom;
