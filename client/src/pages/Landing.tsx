import React from "react";
import { Link } from "react-router-dom";

const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-bg-white">
      <h1 className="text-4xl font-bold mb-8">Welcome to Firo$ Money</h1>
      <div className="space-y-4">
        <Link to="/create-room" className="btn-primary block">
          Create Room
        </Link>
        <Link to="/join-room" className="btn-secondary block">
          Join Room
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;
