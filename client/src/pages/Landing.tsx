import React, { useState } from "react";
import { Link } from "react-router-dom";
const LandingPage: React.FC = () => {
  const [userName, setUserName] = useState<string>("");

  return (
    <main className="font-ge-bold bg-no-repeat bg-cover lg:h-screen flex flex-col justify-center items-center h-[100svh]">
      <div className="flex flex-col items-center justify-center bg-bg-pink w-[95vw] lg:w-[35vw] lg:h-[30vh] rounded-3xl lg:p-10 shadow-[5px_5px_0px_0px_rgba(109,40,217)]">
        <h1 className="text-4xl font-bold mb-8">Firo$ Money</h1>
        <input
          type="text"
          placeholder="სახელი"
          onChange={(e) => setUserName(e.target.value)}
        />

        <Link
          to="/create-room"
          className="border-2 border-solid border-blue-900 bg-blue-700  text-2xl lg:p-5 p-3 m-2 text-white rounded-[30px]"
          state={{ userName: userName }}
        >
          შექმენი ოთახი
        </Link>
        <Link
          to="/join-room"
          className="border-2 border-solid border-blue-900 bg-blue-700  text-2xl lg:p-5 p-3 m-2 text-white rounded-[30px]"
          state={{ userName: userName }}
        >
          შედი ოთახში
        </Link>
      </div>
    </main>
  );
};

export default LandingPage;
