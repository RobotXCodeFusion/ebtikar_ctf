require("dotenv").config();
const express = require("express");
const app = express();
const { createServer } = require('http');

const fs = require("fs");

const { Server } = require('socket.io');
const knex = require("./utils/db");

const server = createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

io.on('connection', async (socket) => {
    const { room } = socket.handshake.query;

    if(room == "player") {
        const name = socket.handshake.query.name;
        socket.emit("leaderboard_player", name);
        const data = await knex("users").select("*").where({ name }).first();
        if(!data) {
            await knex("users").insert({
                name,
                timestamp: Date.now()
            })
        }
        socket.on("fail", async (reason) => {
            try {
                const userData = await knex("users").select("*").where({ name }).first();
                if(userData.won) return;
                await knex("users").where({ name }).del();
                console.log("Deleted user", name, reason);

                try {
                    const sockets = await io.sockets.fetchSockets()
                    for(const socket of sockets) {
                        if(socket.handshake.query.room == "leaderboard") {
                            socket.emit("refresh_page");
                        }
                    }
                } catch {}
            } catch {}

        })
    }
    console.log(room == "leaderboard" ? "Leaderboard connected" : "Player connected");

});

app.post("/submit", async (req, res) => {
    const { solution, name } = req.body;
    console.log(req.body)
    if(!solution || !name) return res.status(400).json({
        success: false,
        message: "Invalid request"
    });

    const data = await knex("users").select("*").where({ name }).first();
    if(data) {
        const sdhf = new Date().getFullYear();
        if(solution.toLowerCase() == "RobotXCodeFusionEIS".toLowerCase() + sdhf) {
            const timeSolved = Date.now() - data.timestamp;
            await knex("users").where({ name }).update({
                won: true,
                time: timeSolved
            });
            
            try {
                const sockets = await io.sockets.fetchSockets()
                for(const socket of sockets) {
                    if(socket.handshake.query.room == "leaderboard") {
                        socket.emit("refresh_page");
                    }
                }
            } catch {}

            return res.status(200).json({
                success: true,
                message: "You have won!"
            });

        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid solution"
            })
        }
    } else {
        return res.status(400).json({
            success: false,
            message: "User not found"
        })
    }
})

app.get("/:name", async (req, res, next) => {
    const { name } = req.params;
    if(fs.existsSync(`./html/${name}.html`)) {
        res.sendFile(__dirname + `/html/${name}.html`);
    } else next();
});

app.get("/keyy", (req, res) => {
    res.send("Club name + committee name + EIS + current year\nWe don't care about the capitalization");
})

app.get("/leaderboard_thing", async (req, res) => {
    const data = await knex("users").select("*").orderBy("time", "asc");
    res.json(data);
});

app.post("/create_user", async (req, res) => {
    const { name, phone } = req.body;
    if(!name || !phone) return res.status(400).json({
        success: false,
        message: "Invalid request"
    });

    const data = await knex("users").select("*").where({ name }).first();
    if(data) {
        return res.status(400).json({
            success: false,
            message: "User already exists"
        })
    } else {
        await knex("users").insert({
            name,
            phone,
            timestamp: Date.now(),
            won: false
        });

        try {
            const otherData = await knex("other_things").select("*").where({ key: "playerCount" }).first();
            if(otherData) {
                await knex("other_things").where({ key: "playerCount" }).update({
                    value: (parseInt(otherData.value) + 1).toString()
                });
            } else {
                await knex("other_things").insert({
                    key: "playerCount",
                    value: "1"
                });
            }

        } catch {}

        try {
            const sockets = await io.sockets.fetchSockets()
            for(const socket of sockets) {
                if(socket.handshake.query.room == "leaderboard") {
                    socket.emit("add_player", name);
                }
            }
        } catch {}
        return res.status(200).json({
            success: true,
            message: "User created"
        });

    }
})

const listener = server.listen(process.env.PORT, () => {
    console.log(`Listening to ${listener.address().port}`)
});