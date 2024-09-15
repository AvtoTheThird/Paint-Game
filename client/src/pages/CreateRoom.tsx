import React, { useState } from "react";
import socket from "../components/socket";

function CreateRoom() {
  const [roomData, setRoomData] = useState<any>({});
  const createRoom = () => {
    socket.emit("create_room", { ...roomData });
    // console.log(roomData);
  };
  return (
    <main className="font-ge-bold bg-no-repeat bg-cover lg:h-screen flex flex-col justify-center items-center">
      {" "}
      <div className="flex flex-col items-center justify-center bg-bg-pink rounded-3xl w-[95vw] lg:w-auto px-10 py-5 shadow-[5px_5px_0px_0px_rgba(109,40,217)]">
        <p className="text-2xl whitespace-nowrap font-extrabold text-white pb-5">
          შექმენი ოთახი{" "}
        </p>
        <div className="lg:flex gap-5 items-center justify-between pb-3 lg:w-[600px]">
          <p className="text-2xl whitespace-nowrap font-extrabold text-white">
            room name
          </p>
          <input
            className="h-[50px] border-2 border-solid border-red-800	rounded-[40px] w-full"
            type="text"
            name=""
            id=""
            onChange={(e) => {
              setRoomData({ ...roomData, name: e.target.value });
            }}
          />
        </div>

        <div className="lg:flex gap-5 items-center justify-between pb-3 lg:w-[600px]">
          {" "}
          <p className="text-2xl whitespace-nowrap font-extrabold text-white">
            room ID
          </p>
          <input
            className="h-[50px] border-2 border-solid border-red-800	rounded-[40px] w-full"
            type="text"
            name=""
            id=""
            onChange={(e) => {
              setRoomData({ ...roomData, id: e.target.value });
            }}
          />
        </div>

        <div className="lg:flex gap-5 items-center justify-between pb-3 lg:w-[600px]">
          <p className="text-2xl whitespace-nowrap font-extrabold text-white">
            max players
          </p>
          <input
            className="h-[50px] border-2 border-solid border-red-800	rounded-[40px] w-full"
            type="text"
            name=""
            id=""
            onChange={(e) => {
              setRoomData({
                ...roomData,
                maxPlayers: Number(e.target.value),
              });
            }}
          />
        </div>
        <div className="lg:flex gap-5 items-center justify-between pb-3 lg:w-[600px]">
          <p className="text-2xl whitespace-nowrap font-extrabold text-white">
            time
          </p>
          <input
            className="h-[50px] border-2 border-solid border-red-800	rounded-[40px] w-full"
            type="text"
            name=""
            id=""
            onChange={(e) => {
              setRoomData({
                ...roomData,
                time: Number(e.target.value),
              });
            }}
          />
        </div>

        <button
          onClick={createRoom}
          className="border-2 border-solid border-blue-900 bg-blue-700 w-[180px] h-[80px] text-2xl text-white rounded-[30px]"
        >
          შექმენი ოთახი
        </button>
        {/* <button id="celebrateBtn" onClick={handleButtonClick}>
              log
            </button> */}
      </div>
    </main>
  );
}

export default CreateRoom;
