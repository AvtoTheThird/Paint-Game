import React, { useState } from "react";

const socialLinks = [
  {
    name: "Facebook",
    url: "https://www.facebook.com",
    bwLogo: "/facebook.png",
    colorLogo: "/facebook-color.png",
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com",
    bwLogo: "/instagram.png",
    colorLogo: "/instagram-color.png",
  },
  {
    name: "TikTok",
    url: "https://www.tiktok.com",
    bwLogo: "/tiktok.png",
    colorLogo: "/tiktok-color.png",
  },
];

function Links() {
  const [hovered, setHovered] = useState<any>(null);

  return (
    <div className="fixed flex bottom-2 right-2 bg-white bg-opacity-20 text-white text-sm px-1 py-1 rounded z-50">
      {socialLinks.map((link, index) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-2"
          onMouseEnter={() => setHovered(index)}
          onMouseLeave={() => setHovered(null)}
        >
          <img
            className="h-[35px] hover:scale-125 transition-transform"
            src={hovered === index ? link.colorLogo : link.bwLogo}
            alt={`${link.name} Logo`}
          />
        </a>
      ))}
    </div>
  );
}

export default Links;
