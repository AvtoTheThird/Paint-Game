import React from "react";
interface Player {
  avatarID: string;
  hasGussed: boolean;
  id: string;
  name: string;
  roomid: string;
  roomName: string;
  score: number;
}
const EndOFGameScreen: React.FC<{
  endOFGameScreenData: { joinedUsers: any };
}> = ({ endOFGameScreenData }) => {
  // console.log(endOFGameScreenData);
  const playersArray = Object.values(endOFGameScreenData);
  const topPlayers: Player[] = playersArray
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // console.log(topPlayers);
  // console.log(
  //   "top3 mfs",
  //   endOFGameScreenData.joinedUsers
  //     .sort((a: { score: any }, b: { score: any }) => b.score - a.score)
  //     .slice(0, 3)
  // );

  return (
    <>
      {" "}
      <div className=" justify-start items-center flex-col absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  bg-white border-4 border-dark-pink w-[706px] h-[528px] xl:scale-75 2xl:scale-100 lg:scale-50 rounded-[1rem]  gap-5 z-50 pinkBackground sm:flex md:flex hidden">
        <div className="flex justify-evenly w-[674px] h-[302px] bg-light-pink border-4 border-dark-pink mt-2 rounded-2xl shadow-[0_3px_10px_rgb(0,0,0,0.4)]">
          <div
            id="#2"
            className="w-[150px] h-[300px] flex items-center flex-col pt-6"
          >
            <span className="text-[20px]">{topPlayers[1]?.name}</span>
            <img
              className="w-[130px] h-[170px] bg-slate-300 rounded-md border-gray-500 border-[1px]  "
              src={`${topPlayers[1]?.avatarID}.svg`}
              alt={".."}
            />
            <span className="text-[50px]">2</span>
          </div>
          <div
            id="#1"
            className=" w-[190px] h-[370px] z-10 flex items-center flex-col"
          >
            <span className="text-[20px]">{topPlayers[0]?.name}</span>

            <img
              className="w-[130px] h-[170px] bg-slate-300 rounded-md border-gray-500 border-[1px]  "
              src={`${topPlayers[0]?.avatarID}.svg`}
              alt={".."}
            />
            <span className="text-[50px]">1</span>
          </div>
          {topPlayers.length > 2 ? (
            <div
              id="#3"
              className="w-[150px] h-[300px] flex items-center flex-col pt-6"
            >
              <span className="text-[20px]">{topPlayers[2]?.name}</span>

              <img
                className="w-[130px] h-[170px] bg-slate-300 rounded-md border-gray-500 border-[1px]  "
                src={`${topPlayers[2]?.avatarID}.svg`}
                alt={".."}
              />
              <span className="text-[50px]">3</span>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col justify-center  gap-1 flex-wrap h-[200px] text-left">
          {topPlayers.splice(0, 3).map((player, index) => (
            <span key={index} className="text-black   text-lg ">
              #{index + 1} {player.name}
            </span>
          ))}{" "}
        </div>
      </div>
      <div className="justify-start items-center flex-col absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  bg-bg-pink border-4 border-dark-pink   rounded-[1rem]  gap-1 z-50 w-[250px] h-[150px] sm:hidden md:hidden flex">
        {playersArray.map((player, index) => (
          <span key={index} className="text-black   text-sm ">
            #{index + 1} {player.name}
          </span>
        ))}
      </div>
    </>
  );
};
export default EndOFGameScreen;
