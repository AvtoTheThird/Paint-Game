import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CarouselProps {
  Fimages: string[];
  Mimages: string[];
  onImageChange: (image: string, indexed: string) => void;
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
  const [gender, setGender] = useState<"male" | "female">(
    (localStorage.getItem("gender") as "male" | "female") || "male"
  );
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [cachedImage, setCachedImage] = useState<string | null>(null);
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const isMounted = useRef(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    setCurrentImages(gender === "male" ? Mimages : Fimages);
  }, [gender, Mimages, Fimages]);

  useEffect(() => {
    const savedGender = localStorage.getItem("gender") as "male" | "female";
    if (savedGender === "female") {
      setGender("female");
    } else {
      setGender("male");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("preferredImageIndex", currentIndex.toString());
    if (currentImages.length > 0) {
      onImageChange(
        currentImages[currentIndex],
        gender === "female" ? Fimages[currentIndex] : Mimages[currentIndex]
      );
    }
  }, [currentIndex, currentImages, onImageChange, gender, Fimages, Mimages]);

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async () => {
      try {
        const request = window.indexedDB.open("imageCacheDB", 1);

        request.onerror = (event) => {
          console.error(
            "Error opening database:",
            (event.target as IDBRequest)?.error
          );
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBRequest).result as IDBDatabase;
          if (!db.objectStoreNames.contains("images")) {
            db.createObjectStore("images", { keyPath: "id" });
          }
        };

        request.onsuccess = async (event) => {
          if (isMounted.current) {
            const database = (event.target as IDBRequest).result as IDBDatabase;
            setDb(database);
            // Fetch the initial image here after DB is ready
            if (currentImages.length > 0) {
              const initialImagePath =
                gender === "female"
                  ? Fimages[currentIndex]
                  : Mimages[currentIndex];
              const image = await loadImage(initialImagePath);
              if (isMounted.current) {
                setCachedImage(image);
                setLoading(false);
              }
            }
          }
        };
      } catch (error) {
        console.error("Error initializing database:", error);
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    initDB();

    return () => {
      if (db) {
        db.close();
        setDb(null);
      }
    };
  }, [currentIndex, gender, Fimages, Mimages, currentImages]);
  // Function to fetch or cache the image from db or network
  const loadImage = async (imagePath: string) => {
    if (!db) return imagePath;

    try {
      const cachedData = await getCachedImage(imagePath);
      if (cachedData) {
        return URL.createObjectURL(cachedData);
      }

      const fetchedData = await fetchImage(imagePath);
      if (fetchedData) {
        await cacheImage(imagePath, fetchedData);
        return URL.createObjectURL(fetchedData);
      }

      return imagePath;
    } catch (error) {
      console.error("Error loading image:", error);
      return imagePath;
    }
  };
  // Fetch and Cache Image Data
  const cacheImage = async (imagePath: string, data: Blob) => {
    if (!db) return;

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(["images"], "readwrite");
      const store = transaction.objectStore("images");

      const request = store.put({ id: imagePath, data: data });

      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        console.error(
          "Error caching image:",
          (event.target as IDBRequest).error
        );
        reject((event.target as IDBRequest).error);
      };
    });
  };
  // Function to fetch image data from network
  const fetchImage = async (imagePath: string): Promise<Blob | null> => {
    try {
      const response = await fetch(`.${imagePath}.svg`);
      if (!response.ok) {
        console.error(`Failed to fetch image ${imagePath}: `, response);
        return null;
      }
      return await response.blob();
    } catch (error) {
      console.error(`Failed to fetch image ${imagePath}:`, error);
      return null;
    }
  };
  // Function to get cached image
  const getCachedImage = async (imagePath: string): Promise<Blob | null> => {
    if (!db) return null;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["images"], "readonly");
      const store = transaction.objectStore("images");
      const request = store.get(imagePath);

      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        if (result && result.data) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };

      request.onerror = (event) => {
        console.error(
          "Error retrieving cached image:",
          (event.target as IDBRequest).error
        );
        reject((event.target as IDBRequest).error);
      };
    });
  };
  useEffect(() => {
    setCachedImage(null);
    setLoading(true);
  }, [gender]);

  // Load Image when index changes
  useEffect(() => {
    const loadImageAndUpdate = async () => {
      if (currentImages.length > 0) {
        const imagePath =
          gender === "female" ? Fimages[currentIndex] : Mimages[currentIndex];

        const image = await loadImage(imagePath);
        if (isMounted.current) {
          setCachedImage(image);
        }
      }
    };

    if (!loading) {
      loadImageAndUpdate();
    }
  }, [currentIndex, currentImages, gender, Fimages, Mimages, loading]);

  const handleNext = () => {
    setDirection("right");
    setCurrentIndex((prevIndex) =>
      prevIndex + 1 === currentImages.length ? 0 : prevIndex + 1
    );
  };

  const handlePrevious = () => {
    setDirection("left");
    setCurrentIndex((prevIndex) =>
      prevIndex - 1 < 0 ? currentImages.length - 1 : prevIndex - 1
    );
  };
  return (
    <div className="w-[250px] h-[337px] rounded-lg">
      <label className="rocker">
        <input
          type="checkbox"
          checked={gender === "female" ? false : true}
          onChange={() => {
            setGender(gender === "female" ? "male" : "female");
            localStorage.setItem(
              "gender",
              gender === "female" ? "male" : "female"
            );
          }}
        />
        <span className="switch-left">კ</span>
        <span className="switch-right">ქ</span>
      </label>
      <div className="carousel-images">
        <AnimatePresence>
          <motion.img
            key={currentIndex}
            src={cachedImage || ""}
            initial={direction === "right" ? "hiddenRight" : "hiddenLeft"}
            animate="visible"
            exit="exit"
            style={{ display: cachedImage && !loading ? "block" : "none" }}
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
        </div>
      </div>
    </div>
  );
};

export default Carousel;
