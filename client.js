const { io } = require("socket.io-client");
const socket = io("http://localhost:3000", {
    extraHeaders: {
        room: "player",
        name: "Mohammed"
    }
});

const axios = require("axios").default;

socket.on("connect", () => {
    console.log("Connected!");

    setTimeout(() => {
        axios.post("http://localhost:3000/submit", {
            solution: "RobotXCodeFusionEIS2024",
            name: "Mohammed"
        }).then(console.log).catch(console.error);
    }, 3000)

    socket.on("winner", name => {
        if(name == "Mohammed") {
            console.log("I HAVE WON!");
        }
    });
})