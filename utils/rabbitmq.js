const amqp = require('amqplib');

let connection = null;
let channel = null;
let isInitialized = false;

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;
const EXCHANGE_NAME = 'chat_exchange';
const EXCHANGE_TYPE = 'direct';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function createChannel() {
    if (!connection) {
        throw new Error('Connection not established');
    }
    const ch = await connection.createChannel();
    await ch.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });
    return ch;
}

const initializeRabbitMQ = async (uri, retries = MAX_RETRIES) => {
    if (isInitialized) {
        console.log('RabbitMQ already initialized');
        return;
    }

    while (retries > 0) {
        try {
            connection = await amqp.connect(uri);
            channel = await createChannel();
            isInitialized = true;

            connection.on('close', async () => {
                console.warn('RabbitMQ connection closed');
                isInitialized = false;
                channel = null;
                await reconnect(uri);
            });

            connection.on('error', async (error) => {
                console.error('RabbitMQ connection error:', error);
                isInitialized = false;
                channel = null;
                await reconnect(uri);
            });

            console.log('RabbitMQ connection and channel established successfully');
            return;

        } catch (error) {
            console.error(`Failed to connect to RabbitMQ. Retries left: ${retries - 1}`, error);
            retries--;

            if (retries === 0) {
                throw new Error('Failed to initialize RabbitMQ after maximum retries');
            }

            await sleep(RETRY_DELAY);
        }
    }
};

async function reconnect(uri) {
    console.log('Attempting to reconnect to RabbitMQ...');
    try {
        await initializeRabbitMQ(uri);
    } catch (error) {
        console.error('Failed to reconnect:', error);
    }
}

const publishToExchange = async (routingKey, message) => {
    if (!isInitialized || !channel) {
        throw new Error('RabbitMQ not initialized or channel not available');
    }

    try {
        const msgBuffer = Buffer.from(JSON.stringify(message));
        const published = channel.publish(EXCHANGE_NAME, routingKey, msgBuffer, {
            persistent: true,
            mandatory: true // Enable mandatory flag to get returns if message can't be routed
        });

        if (!published) {
            throw new Error('Channel write buffer is full');
        }

        console.log(`Message published successfully to exchange "${EXCHANGE_NAME}" with routing key "${routingKey}"`, {
            routingKey,
            messageId: message.id || 'N/A',
            timestamp: new Date().toISOString()
        });

        return true;

    } catch (error) {
        console.error('Error publishing message:', error);
        throw error; // Re-throw to handle in the calling code
    }
};

const consumeFromQueue = async (queue, routingKey, callback) => {
    if (!isInitialized || !channel) {
        throw new Error('RabbitMQ not initialized or channel not available');
    }

    try {
        await channel.assertQueue(queue, { 
            durable: true,
            deadLetterExchange: `${EXCHANGE_NAME}.dlx` // Add dead letter exchange
        });
        
        await channel.bindQueue(queue, EXCHANGE_NAME, routingKey);

        // Set prefetch to control message flow
        await channel.prefetch(1);

        channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const content = JSON.parse(msg.content.toString());
                await callback(content);
                channel.ack(msg);
            } catch (error) {
                console.error('Error processing message:', error);
                // Nack the message and don't requeue if it's a parsing error
                channel.nack(msg, false, false);
            }
        });

        console.log(`Consumer setup complete for queue "${queue}" with routing key "${routingKey}"`);
    } catch (error) {
        console.error('Error setting up consumer:', error);
        throw error;
    }
};

module.exports = { 
    initializeRabbitMQ, 
    publishToExchange, 
    consumeFromQueue,
    isInitialized: () => isInitialized 
};