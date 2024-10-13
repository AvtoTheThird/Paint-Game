import React from "react";
// const Canvas: React.FC<{ canvasData: { roomId: string; userId: string } }> = ({
//   canvasData,
// }) => {
const EndOFHandScreen: React.FC<{
  endOFHandScreenData: { oldWord: string; currentDrawer: string };
}> = ({ endOFHandScreenData }) => {
  //   console.log(endOFHandScreenData);

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center bg-bg-pink p-4 rounded-lg shadow-lg z-50">
      <span className="text-lg">
        სიტყვა იყო{" "}
        <span className="text-blue-700">{endOFHandScreenData.oldWord}</span>{" "}
        <br />
        <span className="text-lg">
          ეხლა ხატამს{" "}
          <span className="text-blue-700">
            {endOFHandScreenData.currentDrawer}
          </span>
        </span>
      </span>
    </div>
  );
};

export default EndOFHandScreen;
