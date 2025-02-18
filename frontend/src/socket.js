import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // Adjust if backend is hosted elsewhere

export default socket;
