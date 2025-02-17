import React from "react";
import { Link } from "react-router-dom";
import Counter from "./Counter";

const Header: React.FC = () => {
  return (
    <header className="lg:fixed top-0 w-full z-50  xl:h-[100px] bg-gradient-to-b from-black/50 to-transparent ">
      <div className="container mx-auto px-4   h-full flex items-center lg:justify-between justify-between lg:mt-[-1.75rem] mt-0">
        <div className="lg:w-1/3 lg:block hidden">
          <Counter />
        </div>
        <a
          href="#home"
          className="block lg:hidden text-white text-sm hover:text-pink  lg:text-xl text-md transition-all duration-200 ease-in-out"
        >
          წესები
        </a>
        <div className="flex items-center">
          <Link to="/">
            <img
              src="/xelovniki.png"
              alt="Logo"
              className="2xl:w-[220px] 2xl:pt-[110px]  xl:w-[200px] xl:pt-[80px] w-[180px] pt-[10px] "
            />
          </Link>
        </div>
        <div className="lg:w-1/3 flex justify-end items-center lg:space-x-4 space-x-0 gap-16 lg:pt-3 2xl:pt-[120px] xl:pt-[90px]">
          <Link
            to="/rules"
            className="hidden lg:block text-white hover:text-pink  text-xl transition-all duration-200 ease-in-out"
          >
            თამაშის წესები
          </Link>
          <a
            href="#about"
            className="text-white hover:text-pink lg:text-xl text-sm transition-all duration-200 ease-in-out"
          >
            კონტაქტი
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
