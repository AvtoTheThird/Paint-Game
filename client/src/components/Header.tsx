import React from "react";
import { Link } from "react-router-dom";
import Counter from "./Counter";

const Header: React.FC = () => {
  return (
    <header className="lg:fixed top-0 w-full z-0 xl:h-[180px]  bg-gradient-to-b from-black/80 to-transparent h-[150px]">
      <div className="container mx-auto px-4 h-full flex items-center lg:justify-between justify-between lg:mt-[-2rem]">
        <div className="lg:w-1/3 lg:block hidden">{/* <Counter /> */}</div>
        <Link
          to="/rules"
          className="block lg:hidden text-white text-sm hover:text-pink  lg:text-xl text-md transition-all duration-200 ease-in-out"
        >
          წესები
        </Link>
        <div className="flex items-center">
          <Link to="/">
            <img
              src="/xelovniki.png"
              alt="Logo"
              className="2xl:w-[220px] 2xl:pt-[0px]  xl:w-[200px] xl:pt-[0px] w-[180px] pt-[10px] "
            />
          </Link>
        </div>
        <div className="lg:w-1/3 flex justify-end items-center lg:space-x-4 space-x-0 gap-16 lg:pt-3 2xl:pt-[13px] ">
          <Link
            to="/rules"
            className="hidden lg:block text-white hover:text-pink  text-xl transition-all duration-200 ease-in-out"
          >
            თამაშის წესები
          </Link>
          <Link
            to="/contact"
            className="text-white hover:text-pink lg:text-xl text-sm transition-all duration-200 ease-in-out"
          >
            კონტაქტი
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
