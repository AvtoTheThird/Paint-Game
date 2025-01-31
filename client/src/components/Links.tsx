import React from "react";

function Links() {
  return (
    <div className="fixed flex bottom-2 right-2 bg-bg-white   bg-opacity-70 text-white text-sm px-1 py-1 rounded z-50">
      <a
        href="https://www.facebook.com"
        target="_blank"
        className="text-white mx-2"
      >
        <img
          className="h-[35px] hover:scale-125 transition transform"
          src="/facebook.png"
          alt=""
        />
      </a>
      <a
        href="https://www.instagram.com"
        target="_blank"
        className="text-white mx-2"
      >
        <img
          className="h-[35px] hover:scale-125 transition transform"
          src="/instagram.png"
          alt=""
        />{" "}
      </a>
      <a
        href="https://www.tiktok.com"
        target="_blank"
        className="text-white mx-2"
      >
        <img
          className="h-[35px] hover:scale-125 transition transform"
          src="/tiktok.png"
          alt=""
        />{" "}
      </a>
    </div>
  );
}

export default Links;
