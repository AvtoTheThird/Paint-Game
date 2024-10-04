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
    <main className="font-ge-bold   lg:h-screen flex flex-col justify-center items-center ">
      <div className="my-4 lg:my-0 text-center lg:w-[90vw] lg:h-[95vh] flex flex-col  justify-center items-center  lg:bg-bg-white  lg:rounded-[5rem] rounded-[2rem]">
        <h1 className="text-4xl font-bold lg:mb-8 mb-1 lg:block hidden ">
          Firo$ Money
        </h1>
        {/* <div className=" relative flex flex-col border-[2px] border-red-600 border-dotted  items-center justify-between bg-bg-pink w-[95vw] lg:w-[780px] lg:h-[580px]   rounded-3xl lg:p-10  p-5 shadow-[-5px_5px_0px_0px_rgba(109,40,217)]"> */}

        <div className="flex flex-col   justify-between bg-bg-pink-opacity lg:bg-bg-pink w-[95vw] lg:w-[780px] lg:h-[580px]   rounded-3xl lg:p-10  p-5  shadow-[-5px_5px_3px_0px_rgba(109,40,217)] ">
          <h1 className="text-4xl font-bold lg:mb-8 mb-1 lg:hidden block ">
            Firo$ Money
          </h1>
          <div className="flex lg:flex-row flex-col w-full lg:justify-between  items-center">
            <div className="w-[250px] h-[337px] bg-white rounded-lg"></div>
            <div className="flex flex-col  items-center gap-3">
              <button
                // onClick={handleUndoneClick}
                className=" border-solid bg-button-background-1 border-black border-[1px]  text-[48px]  p-3 m-2 text-white rounded-[30px] lg:w-[240px] lg:h-[100px]  drop-shadow-[-4px_4px_0_rgba(0,0,0,0.2)] text-shadow  transition transform active:scale-95 active:shadow-[inset_4px_4px_4px_rgba(0,0,0,0.4)] "
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
                  <span className="text-white text-shadow">
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
                  className=" border-solid bg-button-background-2 lg:p-0 p-3 border-black border-[1px]  text-[32px]  leading-8  text-white rounded-[30px] lg:w-[278px] lg:h-[100px] drop-shadow-[-4px_4px_0_rgba(0,0,0,0.2)]  transition transform active:scale-95 active:shadow-[inset_4px_4px_4px_rgba(0,0,0,0.4)]"
                >
                  <span className="text-white text-shadow">
                    შექმენი სამეგობრო ოთახი
                  </span>
                </button>
              </Link>
            </div>
          </div>
          <div className="flex flex-col lg:w-[250px] items-center w-full">
            <span className="text-white text-shadow text-2xl">
              თქვენი სახელი
            </span>
            <input
              className=" h-[50px] border-[1px] border-solid border-black	rounded-[40px] w-[250px] placeholder:pl-2 pl-2 lg:text-xl"
              type="text"
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default LandingPage;
