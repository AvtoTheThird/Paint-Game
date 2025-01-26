const DEFAULT_SCORE = 10;

function getAvailablePublicRoom(publicRooms) {
  const availableRooms = Object.keys(publicRooms).filter(
    (id) => publicRooms[id].users.length < publicRooms[id].maxPlayers
  );
  if (availableRooms.length === 0) return createPublicRoom();
  return availableRooms.reduce((a, b) =>
    publicRooms[a].users.length > publicRooms[b].users.length ? a : b
  );
}
const calculateScore = (maxTime, timeOfGuessing) => {
  return timeOfGuessing >= maxTime * 0.9
    ? DEFAULT_SCORE * 10
    : DEFAULT_SCORE *
        Math.floor(9 - ((maxTime - timeOfGuessing) / maxTime) * 8);
};
module.exports = { getAvailablePublicRoom, calculateScore };
