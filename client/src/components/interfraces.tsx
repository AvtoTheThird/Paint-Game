interface Message {
  roomId: string;
  message: string;
  userName: string;
}
interface RecivedMessage {
  message: string;
  userName: string;
}
interface JoinedUsers {
  id: string;
  name: string;
  roomId: string;
  roomName: string;
  score: number;
}
