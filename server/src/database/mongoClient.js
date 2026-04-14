const { MongoClient } = require('mongodb');
require('dotenv').config();

let mongoClient;

async function connectMongo() {
  if (mongoClient) return mongoClient;
  mongoClient = new MongoClient(process.env.MONGODB_URI);
  await mongoClient.connect();
  console.log('MongoDB connected');
  return mongoClient;
}

async function getMongoDb() {
  const client = await connectMongo();
  return client.db();
}

module.exports = { connectMongo, getMongoDb };
