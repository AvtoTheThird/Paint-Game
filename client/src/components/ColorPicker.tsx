import React, { useState, useEffect, useRef } from "react";

const colorList = [
  "000000",
  "993300",
  "333300",
  "003300",
  "003366",
  "000066",
  "333399",
  "333333",
  "660000",
  "FF6633",
  "666633",
  "336633",
  "336666",
  "0066FF",
  "666699",
  "666666",
  "CC3333",
  "FF9933",
  "99CC33",
  "669966",
  "66CCCC",
  "3366FF",
  "663366",
  "999999",
  "CC66FF",
  "FFCC33",
  "FFFF66",
  "99FF66",
  "99CCCC",
  "66CCFF",
  "993366",
  "CCCCCC",
  "FF99CC",
  "FFCC99",
  "FFFF99",
  "CCffCC",
  "CCFFff",
  "99CCFF",
  "CC99FF",
  "FFFFFF",
];

const ColorPicker = () => {
  const [color, setColor] = useState("#FFFFFF");
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !(pickerRef.current as Node).contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleColorClick = (newColor: any) => {
    setColor(`#${newColor}`);
    setShowPicker(false);
  };

  return (
    <div className="relative " ref={pickerRef}>
      <div className="flex">
        <input
          type="text"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="#FFFFFF"
          className="w-24 px-3 py-2 text-sm uppercase border border-gray-300 rounded-l focus:outline-none focus:border-blue-500"
        />
        <div
          className="w-10 h-10 border border-l-0 border-gray-300 cursor-pointer"
          style={{ backgroundColor: color }}
          onClick={() => setShowPicker(!showPicker)}
        ></div>
      </div>
      {showPicker && (
        <div className="absolute left-0 z-10 p-2 bg-white border border-gray-200 rounded shadow-lg w-36">
          <div className="grid grid-cols-8 gap-1">
            {colorList.map((c) => (
              <div
                key={c}
                className="w-4 h-4 border border-gray-200 cursor-pointer hover:opacity-80"
                style={{ backgroundColor: `#${c}` }}
                onClick={() => handleColorClick(c)}
              ></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
