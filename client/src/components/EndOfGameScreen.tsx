import React from "react";

const EndOFGameScreen: React.FC<{
  endOFGameScreenData: { oldWord: string; currentDrawer: string };
}> = ({ endOFGameScreenData }) => {
  console.log(endOFGameScreenData);

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center bg-modal-pink border-[#A0008B] border-[5px] w-[700px] h-[500px] rounded-[3rem] shadow-[-5px_5px_3px_0px_rgba(109,40,217)] gap-5 z-50">
      <div className="flex  items-end ">
        <div id="#2" className="w-[150px] h-[300px]">
          <div
            id="avatar-placeholder "
            className="w-[123px] h-[154px] bg-red-500 m-auto"
          >
            2
          </div>
          <span className="flex justify-center items-center w-[153px] h-[163px] bg-white text-[114px] rounded-md ">
            2
          </span>
        </div>
        <div id="#1" className="flex-col w-[190px] h-[370px] z-10 ">
          <div
            id="avatar-placeholder "
            className="w-[123px] h-[154px] bg-red-500 m-auto"
          >
            1
          </div>
          <span className="flex justify-center items-center w-[190px] h-[190px] bg-white text-[114px] rounded-md   shadow-[rgba(0,_0,_0,_0.6)_0px_30px_90px]">
            1
          </span>
        </div>
        <div id="#3" className="flex-col  w-[167px] h-[269px] shadow-sm">
          <div
            id="avatar-placeholder "
            className="w-[123px] h-[154px] bg-red-500 m-auto"
          >
            3
          </div>
          <span className="flex justify-center items-center w-[167px] h-[123px] bg-white text-[114px] rounded-md  z-0">
            3
          </span>
        </div>
      </div>
      <div>
        <p className="text-yellow-300 text-shadow text-xl">#1 მჭიდრო_ქიშპობა</p>
        <p className="text-slate-400 text-shadow text-xl">#2 თავზიანი_თავი</p>
        <p className="text-amber-700 text-shadow text-xl">#3 ამაყი_სოკო</p>
      </div>
    </div>
  );
};

export default EndOFGameScreen;
