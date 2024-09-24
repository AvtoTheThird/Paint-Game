import { useEffect, useState } from "react";
import socket from "../components/socket";
import { useNavigate, useLocation } from "react-router-dom";
import { arsebiti, zedsartavi } from "../components/words";
function CreateRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const [roomData, setRoomData] = useState<any>({});
  const [recivedRoomData, setRecivedRoomData] = useState<any>({});
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  useEffect(() => {
    setUserName(location.state.userName);
  }, []);
  const createRoom = (event: any) => {
    event.preventDefault();
    socket.emit("create_room", { ...roomData });
    let dataToBeSent = { roomId: roomData.id, name: userName };
    socket.emit("join_room", dataToBeSent);
    socket.on("userJoined", (data) => {
      console.log(data);
      setUserId(data.id);
      setRecivedRoomData({ ...roomData, id: data.roomId });
    });
    console.log(roomData.id, userId, userName);
  };
  useEffect(() => {
    console.log(roomData.id, userId, userName);
    if (roomData.id) {
      console.log(roomData.id, userId, userName);
      navigate(`/game-room/${roomData.roomId}`, {
        state: {
          roomId: roomData.id,
          userId: userId,
          userName: userName,
          isAdmin: true,
        },
      });
    }
  }, [recivedRoomData]);
  function randomizePassword() {
    let password = "";
    console.log("randomizePassword");

    password += zedsartavi[Math.floor(Math.random() * zedsartavi.length)];
    password += arsebiti[Math.floor(Math.random() * arsebiti.length)];
    console.log(password);

    setRoomData({ ...roomData, id: password });
    console.log(roomData);
  }
  return (
    <main className="font-ge-bold bg-no-repeat bg-cover lg:h-screen flex flex-col justify-center items-center h-[100svh]">
      {" "}
      <form
        onSubmit={createRoom}
        className="flex flex-col items-center justify-center bg-bg-pink rounded-3xl w-[95vw] lg:w-auto px-10 py-5 shadow-[5px_5px_0px_0px_rgba(109,40,217)]"
      >
        <p className="text-2xl whitespace-nowrap font-extrabold text-white pb-5">
          შექმენი ოთახი{" "}
        </p>
        <div className="lg:flex gap-5 items-center justify-between pb-3 lg:w-[600px]">
          <p className="text-2xl whitespace-nowrap font-extrabold text-white">
            room name
          </p>
          <input
            required
            className="h-[50px] border-2 border-solid border-red-800	rounded-[40px] w-full"
            type="text"
            name="roomName"
            id="roomName"
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
          <div className="relative w-full">
            {" "}
            <input
              required
              className="h-[50px] border-2 border-solid border-red-800	rounded-[40px] w-full"
              type="text"
              name="roomId"
              id="roomId"
              value={roomData.id}
              onChange={(e) => {
                setRoomData({ ...roomData, id: e.target.value });
              }}
            />
            <button
              onClick={randomizePassword}
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white px-4 py-1 rounded-md"
            >
              RRR
            </button>
          </div>
        </div>

        <div className="lg:flex gap-5 items-center justify-between pb-3 lg:w-[600px]">
          <p className="text-2xl whitespace-nowrap font-extrabold text-white">
            max players
          </p>
          <input
            required
            className="h-[50px] border-2 border-solid border-red-800	rounded-[40px] w-full"
            type="number"
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
            time
          </p>
          <input
            required
            className="h-[50px] border-2 border-solid border-red-800	rounded-[40px] w-full"
            type="number"
            name="time"
            id="time"
            onChange={(e) => {
              setRoomData({
                ...roomData,
                time: Number(e.target.value),
              });
            }}
          />
        </div>

        <button
          type="submit"
          className="border-2 border-solid border-blue-900 bg-blue-700 w-[180px] h-[80px] text-2xl text-white rounded-[30px]"
        >
          შექმენი ოთახი
        </button>
      </form>
    </main>
  );
}

export default CreateRoom;
