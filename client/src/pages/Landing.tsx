import React, { useState } from "react";
import { Link } from "react-router-dom";
const LandingPage: React.FC = () => {
  const [userName, setUserName] = useState<string>("");
  function handleClicck() {
    alert("შეიყვანეთ სახელი(მინ 3 სიმბოლო)");
  }
  return (
    <main className="font-ge-bold bg-no-repeat bg-cover lg:h-screen flex flex-col justify-center items-center h-[100svh]">
      <div className="flex flex-col items-center justify-center bg-bg-pink w-[95vw] lg:w-[35vw]  rounded-3xl lg:p-10 shadow-[5px_5px_0px_0px_rgba(109,40,217)]">
        <h1 className="text-4xl font-bold mb-8">Firo$ Money</h1>
        <input
          className="h-[50px] border-2 border-solid border-red-800	rounded-[40px] w-full placeholder:pl-2"
          required
          type="text"
          placeholder="სახელი"
          onChange={(e) => setUserName(e.target.value)}
        />
        <button
          onClick={userName.length < 3 ? handleClicck : undefined}
          className="border-2 border-solid border-blue-900 bg-blue-700  text-2xl lg:p-5 p-3 m-2 text-white rounded-[30px]"
        >
          {" "}
          <Link
            to={`${userName.length > 2 ? `/create-room` : `/`}`}
            state={{ userName: userName }}
          >
            შექმენი ოთახი
          </Link>
        </button>
        <button
          onClick={userName.length < 3 ? handleClicck : undefined}
          className="border-2 border-solid border-blue-900 bg-blue-700  text-2xl lg:p-5 p-3 m-2 text-white rounded-[30px]"
        >
          {" "}
          <Link to="/join-room" state={{ userName: userName }}>
            შედი ოთახში
          </Link>
        </button>
      </div>
    </main>
  );
};

export default LandingPage;
