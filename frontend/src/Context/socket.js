import {io} from "socket.io-client";
import config from "../config"

console.log("ENV VARIABLES: " + config.SOCKET_URL + " " + config.API_ENDPOINT);



export const socket = io(config.SOCKET_URL);
