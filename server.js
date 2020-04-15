const express = require("express")
const app = express()

const http = require("http")
const server = http.createServer(app)

const socketio = require("socket.io")
const io = socketio(server)

const formatMessage = require("./utils/messages")

const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require("./utils/users")

// Set static folder
const path = require("path")
app.use(express.static(path.join(__dirname, "public")))

const botName = "God"

// Run when a client connects
io.on("connection", socket => {

    socket.on("joinRoom", ({ username, room }) => {
        const user = userJoin(socket.id, username, room)
        socket.join(user.room)

        // Single user upon connection
        socket.emit("message", formatMessage(botName, "Welcome to the chat app!"))

        // Emit to everyone except connecting user
        socket.broadcast.to(user.room).emit("message", formatMessage(botName, `${user.username} has joined the chat`))
        // To everyone: io.emit()

        // send user and room info
        io.to(user.room).emit("roomUsers", {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    })


    // Listen for chatMessage
    socket.on("chatMessage", (msg) => {
        const user = getCurrentUser(socket.id)

        io.to(user.room).emit("message", formatMessage(user.username, msg))
    })

    // For when client disconnects
    socket.on("disconnect", () => {
        const user = userLeave(socket.id)

        if (user) {
            io.to(user.room).emit("message", formatMessage(botName, `${user.username} has left the chat.`))

            // send user and room info
            io.to(user.room).emit("roomUsers", {
                room: user.room,
                users: getRoomUsers(user.room)
            })
        }
    })
})

// Set up port
const PORT = process.env.PORT || 3000
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))

