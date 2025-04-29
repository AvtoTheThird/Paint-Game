const express = require('express');
const router = express.Router();
const path = require('path');
const { adminAuth } = require('./middleware');

// Serve the admin panel HTML
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Get all rooms with detailed information
router.get('/rooms', adminAuth, async (req, res) => {
    try {
        // Use SCAN instead of KEYS for better performance in production
        const roomKeys = await req.redisClient.sendCommand(['KEYS', 'room:*']);
        const rooms = [];

        for (const key of roomKeys) {
            const roomId = key.replace('room:', '');
            const roomData = await req.redisClient.sendCommand(['HGETALL', key]);
            
            if (roomData && roomData.length >= 2) {
                // Convert array of key-value pairs to object
                const room = {};
                for (let i = 0; i < roomData.length; i += 2) {
                    room[roomData[i]] = roomData[i + 1];
                }

                rooms.push({
                    id: roomId,
                    ...room,
                    users: JSON.parse(room.users || '[]'),
                    currentDrawer: room.currentDrawer,
                    currentWord: room.currentWord,
                    canvas: room.canvas || null
                });
            }
        }

        res.json({ success: true, rooms });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch rooms' });
    }
});

// Shut down a room
router.post('/rooms/:roomId/shutdown', adminAuth, async (req, res) => {
    try {
        const { roomId } = req.params;
        const roomKey = `room:${roomId}`;
        
        const roomData = await req.redisClient.sendCommand(['HGETALL', roomKey]);
        if (!roomData || roomData.length === 0) {
            return res.status(404).json({ success: false, error: 'Room not found' });
        }

        // Convert array to object
        const room = {};
        for (let i = 0; i < roomData.length; i += 2) {
            room[roomData[i]] = roomData[i + 1];
        }

        // Notify all users in the room
        const io = req.app.get('io');
        const users = JSON.parse(room.users || '[]');
        
        users.forEach(user => {
            io.to(user.id).emit('roomShutdown', { message: 'Room has been shut down by admin' });
        });

        // Delete the room from Redis
        await req.redisClient.sendCommand(['DEL', roomKey]);

        res.json({ success: true, message: 'Room shut down successfully' });
    } catch (error) {
        console.error('Error shutting down room:', error);
        res.status(500).json({ success: false, error: 'Failed to shut down room' });
    }
});

// Kick a player from a room
router.post('/rooms/:roomId/kick/:playerId', adminAuth, async (req, res) => {
    try {
        const { roomId, playerId } = req.params;
        const roomKey = `room:${roomId}`;
        
        const roomData = await req.redisClient.sendCommand(['HGETALL', roomKey]);
        if (!roomData || roomData.length === 0) {
            return res.status(404).json({ success: false, error: 'Room not found' });
        }

        // Convert array to object
        const room = {};
        for (let i = 0; i < roomData.length; i += 2) {
            room[roomData[i]] = roomData[i + 1];
        }

        const users = JSON.parse(room.users || '[]');
        const playerIndex = users.findIndex(user => user.id === playerId);
        
        if (playerIndex === -1) {
            return res.status(404).json({ success: false, error: 'Player not found in room' });
        }

        // Remove the player
        const [kickedUser] = users.splice(playerIndex, 1);
        room.users = JSON.stringify(users);

        // Update Redis
        const hmsetArgs = ['HMSET', roomKey];
        for (const [key, value] of Object.entries(room)) {
            hmsetArgs.push(key, value);
        }
        await req.redisClient.sendCommand(hmsetArgs);

        // Notify the room and the kicked player
        const io = req.app.get('io');
        io.to(roomId).emit('userKicked', kickedUser);
        io.to(playerId).emit('youWereKicked');
        
        // Disconnect the socket
        const socket = io.sockets.sockets.get(playerId);
        if (socket) {
            socket.disconnect(true);
        }

        res.json({ success: true, message: 'Player kicked successfully' });
    } catch (error) {
        console.error('Error kicking player:', error);
        res.status(500).json({ success: false, error: 'Failed to kick player' });
    }
});

module.exports = router;
