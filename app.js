const mongo  = require('mongodb').MongoClient;
const config = require('./config/database');
const client = require('socket.io').listen(config.port).sockets;

// Connect to mongo
mongo.connect(config.databasePort + config.dbName, (err, db) => {
    if (err) {
        throw err;
    }
    console.log('Mongo Database connected');

// Connect to socket.io
    client.on('connection', () => {
        let chat = db.collection('chats');

       // Create function to send status
        sendStatus = (s) => {
            socket.emit('status', s);
        };

        // Get chats from mongo collection
        chat.find().limit(50).sort({_id:1}).toArray((err, res) => {
            if (err) {
                throw err
            }

            // If no error emit messages
            socket.emit('output', res)
        });

    // Handle input events
        socket.on('input', (data) => {
            let name    = data.name;
            // let sub     = data.subject;
            let message = data.message

            // Check for name and message
            if (name == '' || message == '') {
                //Send error status
                sendStatus('Please name and message')
            } else {
                // Insert message into database
                chat.insert({name: name,
                             message: message
                },() => {
                    client.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    })
                })
            }
        });

        // Handle clear
        socket.on('clear', (data) => {
            // Remove all chats from the collection
            chat.remove({}, () => {
                // EMit cleared
                socket.emit('cleared');
            })
        })
    });
});
