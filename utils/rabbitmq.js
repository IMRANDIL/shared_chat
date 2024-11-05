// shared/config/rabbitmq.js
const amqp = require('amqplib');

let connection;
let channel;

// Define the number of retries and delay between each attempt (in ms)
const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // 2 seconds

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Initialize RabbitMQ connection and channel with retry logic
const initializeRabbitMQ = async (retries = MAX_RETRIES) => {
  while (retries > 0) {
    try {
      connection = await amqp.connect(process.env.RABBITMQ_URL);
      channel = await connection.createChannel();
      console.log('RabbitMQ connection established.');
      
      // Handle connection close and errors to attempt reconnection
      connection.on('close', () => {
        console.warn('RabbitMQ connection closed. Attempting to reconnect...');
        initializeRabbitMQ();
      });
      connection.on('error', (error) => {
        console.error('RabbitMQ connection error:', error);
        initializeRabbitMQ();
      });
      
      return; // Exit the function once connected successfully
    } catch (error) {
      console.error(`Failed to connect to RabbitMQ. Retries left: ${retries - 1}`, error);
      retries -= 1;

      if (retries === 0) {
        console.error('Max retries reached. Could not connect to RabbitMQ.');
        throw error; // Throw the error if all retries are exhausted
      }

      console.log(`Retrying RabbitMQ connection in ${RETRY_DELAY / 1000} seconds...`);
      await sleep(RETRY_DELAY);
    }
  }
};

// Publish a message to a specified queue
const publishToQueue = async (queue, message) => {
  try {
    if (!channel) throw new Error('RabbitMQ channel not initialized');
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    console.log(`Message sent to queue "${queue}":`, message);
  } catch (error) {
    console.error('Error publishing message to queue:', error);
  }
};

// Consume messages from a specified queue
const consumeFromQueue = async (queue, callback) => {
  try {
    if (!channel) throw new Error('RabbitMQ channel not initialized');
    await channel.assertQueue(queue, { durable: true });
    channel.consume(queue, (msg) => {
      if (msg) {
        callback(JSON.parse(msg.content.toString()));
        channel.ack(msg);
      }
    });
    console.log(`Consuming messages from queue "${queue}"`);
  } catch (error) {
    console.error('Error consuming messages from queue:', error);
  }
};

module.exports = { initializeRabbitMQ, publishToQueue, consumeFromQueue };
