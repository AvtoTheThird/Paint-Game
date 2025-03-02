import React, { useEffect, useState } from "react";
import socket from "../components/socket";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header.tsx";
import Links from "../components/Links.tsx";
function CreateRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const [roomData, setRoomData] = useState<any>({});
  const [recivedRoomData, setRecivedRoomData] = useState<any>({});
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [avatarID, setAvatarID] = useState<string>("");

  useEffect(() => {
    setUserName(location.state.userName);
    setAvatarID(location.state.avatarID);
  }, []);

  const createRoom = (event: any) => {
    event.preventDefault();

    socket.emit("create_room", { ...roomData });

    const dataToBeSent = { roomId: roomData.id, name: userName, avatarID };

    setTimeout(() => {
      socket.emit("join_room", dataToBeSent);
    }, 500);

    socket.on("userJoined", (data) => {
      console.log(data);
      setUserId(data.id);
      setRecivedRoomData({ ...roomData, id: data.roomId });
    });
    console.log(roomData);
  };
  useEffect(() => {
    console.log(roomData);
    if (roomData.id) {
      console.log(roomData.id, userId, userName);
      navigate(`/game-room/${roomData.roomId}`, {
        state: {
          roomId: roomData.id,
          userId: userId,
          userName: userName,
          isAdmin: true,
          avatarID,
        },
      });
    }
  }, [recivedRoomData]);

  const goBack = () => {
    navigate("/");
  };
  return (
    <main className="font-ge-bold   lg:h-screen flex flex-col justify-center items-center h-[100svh]">
      <Header />
      <div className="h-[100svh]  lg:w-[90vw] lg:h-[95vh] flex flex-col  justify-center items-center  ">
        <form
          onSubmit={createRoom}
          autoComplete="off"
          className="xl:scale-75 2xl:scale-100 relative flex flex-col items-center justify-evenly bg-bg-pink rounded-3xl w-[95vw] lg:w-[750px] lg:h-[550px] px-5  border-2 border-black "
        >
          <div className="absolute w-3.5 h-3.5 bg-white rounded-full top-4 left-4 border-[1px] border-black "></div>
          <div className="absolute w-3.5 h-3.5 bg-white rounded-full top-4 right-4 border-[1px] border-black "></div>
          <div className="absolute w-3.5 h-3.5 bg-white rounded-full bottom-4 right-4 border-[1px] border-black "></div>
          <div className="absolute w-3.5 h-3.5 bg-white rounded-full bottom-4 left-4 border-[1px] border-black "></div>
          <div className="mt-5 flex flex-col gap-5 items-center justify-between  w-full bg-bg-black p-2 rounded-2xl">
            <div className="lg:flex gap-5 items-center justify-between pb-3 lg:w-[600px]">
              <p className="text-2xl whitespace-nowrap font-extrabold text-white">
                ოთახის პაროლი
              </p>
              <div className="flex gap-2">
                <button
                  // onClick={randomizePassword}
                  type="button"
                  className=" bg-blue-500 text-white px-2  rounded-md hidden"
                >
                  R
                </button>
                <input
                  minLength={3}
                  maxLength={15}
                  onInvalid={(e) => {
                    (e.target as HTMLInputElement).setCustomValidity(
                      "სახელი უნდა იყოს ცოტა დიდი."
                    );
                  }}
                  onInput={(e) => {
                    (e.target as HTMLInputElement).setCustomValidity("");
                  }}
                  required
                  className="h-[50px] border-2 border-solid border-red-800	rounded-[15px] w-[350px]"
                  type="text"
                  name="roomId"
                  id="roomId"
                  value={roomData.id}
                  onChange={(e) => {
                    setRoomData({ ...roomData, id: e.target.value });
                  }}
                />
              </div>
            </div>
            <div className="lg:flex gap-5 items-center justify-between pb-3 lg:w-[600px]">
              <p className="text-2xl whitespace-nowrap font-extrabold text-white brake-all">
                მოთამაშეების <br />
                რაოდენობა
              </p>
              <input
                max={16}
                min={2}
                maxLength={2}
                onInvalid={(e) => {
                  (e.target as HTMLInputElement).setCustomValidity(
                    "მაქსიმუმ 16, მინიმუმ 2."
                  );
                }}
                onInput={(e) => {
                  (e.target as HTMLInputElement).setCustomValidity("");
                }}
                required
                className="h-[50px] border-2 border-solid border-red-800	rounded-[15px] w-[350px]"
                type="number"
                pattern="\d*"
                name="maxPlayers"
                id="maxPlayers"
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
                ხატვის დრო (წამი)
              </p>
              <input
                max={300}
                min={20}
                onInvalid={(e) => {
                  (e.target as HTMLInputElement).setCustomValidity(
                    "მაქსიმუმ 300 წამი, მინიმუმ 20 წამი."
                  );
                }}
                onInput={(e) => {
                  (e.target as HTMLInputElement).setCustomValidity("");
                }}
                required
                className="h-[50px] border-2 border-solid border-red-800	rounded-[15px] w-[350px]"
                type="number"
                name="time"
                pattern="\d*"
                id="time"
                onChange={(e) => {
                  setRoomData({
                    ...roomData,
                    time: Number(e.target.value),
                  });
                }}
              />
            </div>
            <div className="lg:flex gap-5 items-center justify-between pb-3 lg:w-[600px]">
              <p className="text-2xl whitespace-nowrap font-extrabold text-white">
                რაუნდები{" "}
              </p>
              <input
                max={8}
                min={1}
                onInvalid={(e) => {
                  (e.target as HTMLInputElement).setCustomValidity(
                    "მაქსიმუმ 8 რაუნდი, მინიმუმ 1 რაუნდი."
                  );
                }}
                onInput={(e) => {
                  (e.target as HTMLInputElement).setCustomValidity("");
                }}
                required
                className="h-[50px] border-2 border-solid border-red-800	rounded-[15px] w-[350px]"
                type="number"
                name="time"
                pattern="\d*"
                id="time"
                onChange={(e) => {
                  setRoomData({
                    ...roomData,
                    maxRounds: Number(e.target.value),
                  });
                }}
              />
            </div>
          </div>
          <div className="flex gap-10">
            <button
              className=" border-solid bg-button-background-1 border-black border-[1px]  text-[36px]   text-white rounded-[30px] lg:w-[200px] lg:h-[80px]  drop-shadow-[-4px_4px_0_rgba(0,0,0,0.2)] transition transform active:scale-95 active:shadow-[inset_4px_4px_4px_rgba(0,0,0,0.4)]"
              onClick={goBack}
            >
              უკან
            </button>
            <button
              type="submit"
              className=" border-solid bg-button-background-1 border-black border-[1px]  text-[36px]   text-white rounded-[30px] lg:w-[200px] lg:h-[80px]  drop-shadow-[-4px_4px_0_rgba(0,0,0,0.2)]"
            >
              თამაში
            </button>
          </div>
        </form>
      </div>
      <Links />
    </main>
  );
}

export default CreateRoom;
