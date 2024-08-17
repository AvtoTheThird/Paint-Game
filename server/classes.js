export class Room {
  constructor(name, id, owner, maxPlayers) {
    this.name = name;
    this.id = id;
    this.owner = owner;
    this.maxPlayers = maxPlayers;
    this.players = [];
    this.players.push(owner);
    addPlayer = (player) => {
      this.players.push(player);
    };
  }
}
