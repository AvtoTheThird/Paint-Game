import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
interface CarouselProps {
  Fimages: string[];
  Mimages: string[];
  onImageChange: (image: string) => void; // Callback when the image changes
}

const Carousel: React.FC<CarouselProps> = ({
  Fimages,
  Mimages,
  onImageChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(
    parseInt(localStorage.getItem("preferredImageIndex") || "0", 10)
  );
  const [direction, setDirection] = useState<string | null>(null);
  const [cachedImages, setCachedImages] = useState<string[]>([]);
  const [gender, setGender] = useState<"male" | "female">("male");
  const images = Fimages.concat(Mimages);

  useEffect(() => {
    localStorage.setItem("preferredImageIndex", currentIndex.toString());
    if (cachedImages.length > 0) {
      onImageChange(cachedImages[currentIndex]);
    }
  }, [currentIndex, cachedImages]);

  useEffect(() => {
    const cacheImages = async () => {
      const cached = [];
      for (const image of images) {
        const cachedImage = localStorage.getItem(image);
        if (cachedImage) {
          cached.push(cachedImage);
        } else {
          try {
            const response = await fetch(image);
            const blob = await response.blob();
            const reader = new FileReader();

            await new Promise<void>((resolve) => {
              reader.onloadend = () => {
                const base64Image = reader.result as string;
                localStorage.setItem(image, base64Image); // Store in local storage
                cached.push(base64Image);
                resolve();
              };
              reader.readAsDataURL(blob);
            });
          } catch (error) {
            console.error(`Error caching image: ${image}, error`);
            cached.push(image); // Fallback to the original URL
          }
        }
      }
      setCachedImages(cached);
    };

    cacheImages();
  }, [Fimages, Mimages]);
  console.log(Fimages, Mimages);

  useEffect(() => {
    if (cachedImages.length > 0) {
      onImageChange(cachedImages[currentIndex]);
    }
  }, [currentIndex, cachedImages]);

  const handleNext = () => {
    setDirection("right");
    setCurrentIndex((prevIndex) =>
      prevIndex + 1 === cachedImages.length ? 0 : prevIndex + 1
    );
  };

  const handlePrevious = () => {
    setDirection("left");
    setCurrentIndex((prevIndex) =>
      prevIndex - 1 < 0 ? cachedImages.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="w-[250px] h-[337px] rounded-lg">
      <button
        onClick={() => {
          setGender("female");
          localStorage.setItem("gender", "female");
        }}
      >
        F
      </button>
      <br />
      <button
        onClick={() => {
          setGender("male");
          localStorage.setItem("gender", "male");
        }}
      >
        M
      </button>
      <div className="carousel-images">
        <AnimatePresence>
          <motion.img
            key={currentIndex}
            src={cachedImages[currentIndex]} // Use cached images
            initial={direction === "right" ? "hiddenRight" : "hiddenLeft"}
            animate="visible"
            exit="exit"
          />
        </AnimatePresence>
        <div className="slide_direction">
          <motion.div
            whileHover={{ scale: 1.2 }}
            className="left"
            onClick={handlePrevious}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20"
              viewBox="0 96 960 960"
              width="20"
            >
              <path d="M400 976 0 576l400-400 56 57-343 343 343 343-56 57Z" />
            </svg>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.2 }}
            className="right"
            onClick={handleNext}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20"
              viewBox="0 96 960 960"
              width="20"
            >
              <path d="m304 974-56-57 343-343-343-343 56-57 400 400-400 400Z" />
            </svg>
          </motion.div>
        </div>{" "}
      </div>{" "}
    </div>
  );
};
export default Carousel;
