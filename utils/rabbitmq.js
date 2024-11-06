// shared/config/rabbitmq.js
const amqp = require('amqplib');

let connection;
let channel;

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // 2 seconds
const EXCHANGE_NAME = 'chat_exchange';
const EXCHANGE_TYPE = 'direct';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Initialize RabbitMQ connection and channel with retry logic
const initializeRabbitMQ = async (retries = MAX_RETRIES) => {
  while (retries > 0) {
    try {
      connection = await amqp.connect(process.env.RABBITMQ_URL);
      channel = await connection.createChannel();

      // Declare an exchange for the chat messages
      await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });
      console.log('RabbitMQ connection and channel established.');

      // Handle connection close and errors to attempt reconnection
      connection.on('close', async () => {
        console.warn('RabbitMQ connection closed. Attempting to reconnect...');
        await initializeRabbitMQ();
      });

      connection.on('error', async (error) => {
        console.error('RabbitMQ connection error:', error);
        await initializeRabbitMQ();
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

// Publish a message to a specified queue through an exchange
const publishToExchange = async (routingKey, message) => {
  try {
    if (!channel) throw new Error('RabbitMQ channel not initialized');
    const msgBuffer = Buffer.from(JSON.stringify(message));
    channel.publish(EXCHANGE_NAME, routingKey, msgBuffer, { persistent: true });
    console.log(`Message published to exchange "${EXCHANGE_NAME}" with routing key "${routingKey}":`, message);
  } catch (error) {
    console.error('Error publishing message to exchange:', error);
  }
};

// Consume messages from a specified queue bound to the exchange
const consumeFromQueue = async (queue, routingKey, callback) => {
  try {
    if (!channel) throw new Error('RabbitMQ channel not initialized');

    // Assert the queue and bind it to the exchange with the specified routing key
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, EXCHANGE_NAME, routingKey);

    channel.consume(queue, (msg) => {
      if (msg) {
        callback(JSON.parse(msg.content.toString()));
        channel.ack(msg);
      }
    });
    console.log(`Consuming messages from queue "${queue}" with routing key "${routingKey}"`);
  } catch (error) {
    console.error('Error consuming messages from queue:', error);
  }
};

module.exports = { initializeRabbitMQ, publishToExchange, consumeFromQueue };
