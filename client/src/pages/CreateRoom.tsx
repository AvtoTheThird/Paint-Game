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
      <div className="h-[100svh]  lg:w-[90vw] lg:h-[95vh] flex flex-col  justify-center items-center  bg-bg-white  rounded-[5rem]">
        <h1 className="text-4xl font-bold mb-8 ">Firo$ Money</h1>
        <form
          onSubmit={createRoom}
          className=" relative flex flex-col items-center justify-evenly bg-bg-pink rounded-3xl w-[95vw] lg:w-[780px] lg:h-[580px] px-5 border-[2px] border-red-600 border-dotted shadow-[-5px_5px_0px_0px_rgba(109,40,217)]"
        >
          <div className="absolute w-3.5 h-3.5 bg-white rounded-full top-4 left-4 border-[1px] border-black "></div>
          <div className="absolute w-3.5 h-3.5 bg-white rounded-full top-4 right-4 border-[1px] border-black "></div>
          <div className="absolute w-3.5 h-3.5 bg-white rounded-full bottom-4 right-4 border-[1px] border-black "></div>
          <div className="absolute w-3.5 h-3.5 bg-white rounded-full bottom-4 left-4 border-[1px] border-black "></div>
          <div className="flex flex-col gap-5 items-center justify-between  w-full bg-bg-black p-5 rounded-2xl">
            <div className="lg:flex gap-5 items-center justify-between pb-3 lg:w-[600px]">
              <p className="text-2xl whitespace-nowrap font-extrabold text-white">
                ოთახის სახელი
              </p>
              <input
                required
                className="h-[50px] border-2 border-solid border-red-800	rounded-[15px] w-[350px]"
                type="text"
                name="roomName"
                id="roomName"
                onChange={(e) => {
                  setRoomData({ ...roomData, name: e.target.value });
                }}
              />
            </div>
            <div className="lg:flex gap-5 items-center justify-between pb-3 lg:w-[600px]">
              <p className="text-2xl whitespace-nowrap font-extrabold text-white">
                ოთახის პაროლი
              </p>
              <div className="flex gap-2">
                <button
                  onClick={randomizePassword}
                  type="button"
                  className=" bg-blue-500 text-white px-2  rounded-md"
                >
                  R
                </button>
                <input
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
                required
                className="h-[50px] border-2 border-solid border-red-800	rounded-[15px] w-[350px]"
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
                ხატვის დრო (წამი)
              </p>
              <input
                required
                className="h-[50px] border-2 border-solid border-red-800	rounded-[15px] w-[350px]"
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
            <div className="lg:flex gap-5 items-center justify-between pb-3 lg:w-[600px]">
              <p className="text-2xl whitespace-nowrap font-extrabold text-white">
                რაუნდები{" "}
              </p>
              <input
                required
                className="h-[50px] border-2 border-solid border-red-800	rounded-[15px] w-[350px]"
                type="number"
                name="time"
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

          <button
            type="submit"
            className=" border-solid bg-button-background-1 border-black border-[1px]  text-[36px]   text-white rounded-[30px] lg:w-[200px] lg:h-[80px]  drop-shadow-[-4px_4px_0_rgba(0,0,0,0.2)]"
          >
            თამაში
          </button>
        </form>
      </div>
    </main>
  );
}

export default CreateRoom;
