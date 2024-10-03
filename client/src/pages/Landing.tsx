import React, { useState } from "react";
import { Link } from "react-router-dom";
const LandingPage: React.FC = () => {
  const [userName, setUserName] = useState<string>("");
  function handleClicck() {
    alert("შეიყვანეთ სახელი(მინ 3 სიმბოლო)");
  }
  function handleUndoneClick() {
    alert("ega ara msuhaobs jer");
  }
  return (
    <main className="font-ge-bold   lg:h-screen flex flex-col justify-center items-center h-[100svh]">
      <div className="h-[100svh]  lg:w-[90vw] lg:h-[95vh] flex flex-col  justify-center items-center  bg-bg-white  rounded-[5rem]">
        <h1 className="text-4xl font-bold mb-8 ">Firo$ Money</h1>

        <div className="flex flex-col  items-center justify-evenly bg-bg-pink w-[95vw] lg:w-[40vw] lg:h-[55vh] rounded-3xl  shadow-[-5px_5px_0px_0px_rgba(109,40,217)] ">
          <div className="flex w-full justify-evenly">
            <div className="w-[250px] h-[337px] bg-white rounded-lg"></div>
            <div className="flex flex-col  items-center gap-3">
              <button
                // onClick={handleUndoneClick}
                className=" border-solid bg-button-background-1 border-black border-[1px]  text-[48px]  p-3 m-2 text-white rounded-[30px] lg:w-[240px] lg:h-[100px]  drop-shadow-[-4px_4px_0_rgba(0,0,0,0.2)] transition transform active:scale-95 active:shadow-[inset_4px_4px_4px_rgba(0,0,0,0.4)] "
              >
                თამაში
              </button>
              <Link
                to={`${userName.length > 2 ? `/join-room` : `/`}`}
                state={{ userName: userName }}
              >
                <button
                  onClick={userName.length < 3 ? handleClicck : undefined}
                  className=" border-solid bg-button-background-3 border-black border-[1px]  text-[36px]  leading-10  text-white rounded-[30px] lg:w-[260px] lg:h-[100px] drop-shadow-[-4px_4px_0_rgba(0,0,0,0.2)]  transition transform active:scale-95 active:shadow-[inset_4px_4px_4px_rgba(0,0,0,0.4)] "
                >
                  <span className="text-white drop-shadow-[0_0_3px_black]">
                    შეუერთდი მეგობრებს
                  </span>
                </button>
              </Link>
              <Link
                to={`${userName.length > 2 ? `/create-room` : `/`}`}
                state={{ userName: userName }}
              >
                <button
                  onClick={userName.length < 3 ? handleClicck : undefined}
                  className=" border-solid bg-button-background-2 border-black border-[1px]  text-[32px]  leading-8  text-white rounded-[30px] lg:w-[278px] lg:h-[100px] drop-shadow-[-4px_4px_0_rgba(0,0,0,0.2)]  transition transform active:scale-95 active:shadow-[inset_4px_4px_4px_rgba(0,0,0,0.4)]"
                >
                  <span className="text-white drop-shadow-[0_0_3px_black]">
                    შექმენი სამეგობრო ოთახი
                  </span>
                </button>
              </Link>
            </div>
          </div>
          <div className="flex flex-col  w-full pl-20">
            <span className="text-white drop-shadow-[0_0_3px_black] text-2xl">
              თქვენი სახელი
            </span>
            <input
              className=" h-[50px] border-2 border-solid border-red-800	rounded-[40px] w-[250px] placeholder:pl-2 pl-2"
              required
              type="text"
              placeholder="სახელი"
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default LandingPage;
