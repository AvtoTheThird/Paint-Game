import React, { useState, useEffect, useRef } from "react";

const colorList = [
  "FFFFFF",
  "C1C1C1",
  "EF130B",
  "FF7100",
  "FFE400",
  "00CC00",
  "00FF91",
  "00B2FF",
  "231FD3",
  "A300BA",
  "DF69A7",
  "FFAC8E",
  "A0522D",
  "000000",
  "505050",
  "740B07",
  "C23800",
  "E8A200",
  "004619",
  "00785D",
  "00569E",
  "0E0865",
  "550069",
  "873554",
  "CC774D",
  "63300D",
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
    <div className="relative grid grid-cols-13" ref={pickerRef}>
      {colorList.map((c) => (
        <div
          key={c}
          className="w-6 h-6 border cursor-pointer hover:border-black"
          style={{ backgroundColor: `#${c}` }}
          onClick={() => handleColorClick(c)}
        ></div>
      ))}
    </div>
  );
};

export default ColorPicker;
