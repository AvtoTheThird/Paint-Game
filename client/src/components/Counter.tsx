import React, { useEffect, useState } from "react";
import "../Counter.css";
import socket from "./socket"; // Use the same socket instance

interface CounterState {
  number: number;
  shuffle: boolean;
}

const Counter: React.FC = () => {
  const [state, setState] = useState<CounterState>({
    number: 0, // Initial number
    shuffle: true, // Shuffle state to trigger animation
  });

  const incrementNumber = () => {
    setState((prevState) => ({
      number: prevState.number + 1, // Increment the number by 1
      shuffle: !prevState.shuffle, // Toggle shuffle for animation
    }));
  };
  useEffect(() => {
    // Initial active users count
    fetch("/activeUsers")
      .then((res) => res.json())
      .then((data) => {
        setState((prevState) => ({
          number: data.activeUsers,
          shuffle: !prevState.shuffle,
        }));
      })
      .catch(console.error);

    // Listen for active users updates
    socket.on("activeUsersUpdate", ({ activeUsers }) => {
      setState((prevState) => ({
        number: activeUsers,
        shuffle: !prevState.shuffle,
      }));
    });

    // Cleanup socket listener
    return () => {
      socket.off("activeUsersUpdate");
    };
  }, [socket]);
  const formatDigit = (digit: number) => (digit < 10 ? `0${digit}` : digit);

  // Get shuffled digits and animation states
  const { number, shuffle } = state;
  const currentDigit = formatDigit(number);
  const previousDigit = formatDigit(number - 1 < 0 ? 9 : number - 1);

  const digit1 = shuffle ? previousDigit : currentDigit;
  const digit2 = !shuffle ? previousDigit : currentDigit;

  const animation1 = shuffle ? "fold" : "unfold";
  const animation2 = !shuffle ? "fold" : "unfold";

  return (
    <div>
      <div className="flipClock">
        <div className="flipUnitContainer">
          <div className="upperCard">
            <span>{currentDigit}</span>
          </div>
          <div className="lowerCard">
            <span>{previousDigit}</span>
          </div>
          <div className={`flipCard ${animation1}`}>
            <span>{digit1}</span>
          </div>
          <div className={`flipCard ${animation2}`}>
            <span>{digit2}</span>
          </div>
        </div>
      </div>

      <button onClick={incrementNumber}>Increment</button>
    </div>
  );
};

export default Counter;
