import { useState } from "react";
import Header from "../components/Header";
import Links from "../components/Links";

const socialLinks = [
  {
    name: "Facebook",
    url: "https://www.facebook.com/profile.php?id=61571847909354",
    bwLogo: "/facebook.png",
    colorLogo: "/facebook-color.png",
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/khelovniki/",
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
const Contact: React.FC = () => {
  // const [roomId, setRoomId] = useState("");
  // console.log(currentImage);
  const [hovered, setHovered] = useState<any>(null);

  return (
    <main className="font-ge-bold    flex flex-col justify-start items-center ">
      <Header />
      <div className="xl:scale-75   2xl:scale-90 my-4 lg:my-0 text-center lg:w-[90vw] lg:h-[95vh] flex flex-col  justify-center items-center ">
        <div className="flex flex-col gap-10  items-center  border-2 border-black bg-bg-pink w-[95vw] lg:w-[750px] lg:h-[550px]  rounded-3xl lg:p-10 xl:mt-[40px]  p-5   shadow-lg ">
          <div className="flex flex-col text-white break-all text-center md:text-left">
            <span className="text-2xl md:text-4xl xl:text-5xl mb-4 md:mb-6">
              Business Email address
            </span>
            <span className="text-xl md:text-3xl xl:text-4xl mb-8 md:mb-12">
              UnpaidLabor.Studios@Gmail.com
            </span>
          </div>

          <div className="flex items-center flex-col gap-6 md:gap-10">
            <span className="text-2xl md:text-4xl xl:text-5xl text-center">
              Follow us on socials!
            </span>
            <div className="flex gap-8 md:gap-16 flex-wrap justify-center">
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
                    className="h-8 md:h-12 xl:h-14 hover:scale-125 transition-transform"
                    src={hovered === index ? link.colorLogo : link.bwLogo}
                    alt={`${link.name} Logo`}
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Links />
    </main>
  );
};

export default Contact;
