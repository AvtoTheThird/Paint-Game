import React from "react";
import {Link} from "react-router-dom";

const Header: React.FC = () => {

    return (<header className="fixed top-0 w-full z-50 h-[200px] bg-gradient-to-b from-black/50 to-transparent ">
            <div className="container mx-auto px-4   h-full flex items-center justify-between mt-[-1.75rem]">
                <div className="w-1/3"></div>
                <div className="flex items-center">
                    <Link to="/">
                    <img
                        src="/xelovniki.png"
                        alt="Logo"
                        className="w-[220px]  "
                    />
                    </Link>
                </div>
                <div className="w-1/3 flex justify-end items-center space-x-4 gap-16 pt-3">
                    <a href="#home"
                       className="text-white hover:text-pink  text-xl transition-all duration-200 ease-in-out">თამაშის
                        წესები</a>
                    <a href="#about"
                       className="text-white hover:text-pink text-xl transition-all duration-200 ease-in-out">კონტაქტი</a>
                </div>
            </div>
        </header>

    );
};

export default Header;
