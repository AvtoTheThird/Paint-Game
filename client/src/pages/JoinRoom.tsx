import React, { useEffect, useState } from "react";
import socket from "../components/socket";
import { useNavigate } from "react-router-dom";

function CreateRoom() {
  const [roomId, setRoomId] = useState<string>("");

  const [userName, setUserName] = useState<string>("");
  const [roomData, setRoomData] = useState<any>({});
  const [roomName, setRoomName] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const navigate = useNavigate();

  const joinRoom = () => {
    if (roomId.trim()) {
      let dataToBeSent = { roomId, name: userName };
      // console.log("data to be sent", dataToBeSent);

      socket.emit("join_room", dataToBeSent);
      socket.on("roomError", (data) => {
        alert(data.error);
        false;
        return;
      });

      socket.on("userJoined", (data) => {
        // console.log(data);
        setUserId(data.id);
        setRoomName(data.roomName);
        setRoomData({ ...roomData, id: data.roomId });
      });
      // console.log(roomData);
    }
    // navigate(`/game-room/${roomData.roomId}`)
  };
  useEffect(() => {
    if (roomData.id) {
      navigate(`/game-room/${roomData.roomId}`, {
        state: { roomId: roomData.id, userId: userId, userName: userName },
      });
    }
  }, [roomData]);
  return (
    <main className="font-ge-bold bg-no-repeat bg-cover lg:h-screen flex flex-col justify-center items-center">
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
    </main>
  );
}

export default CreateRoom;
