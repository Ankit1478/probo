// marketModel.js
import mongoose from 'mongoose';

const marketSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  endTime: { type: Date, required: true },
  description: { type: String, required: true },
  sourceOfTrade: { type: String, required: true },
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps
});

const Schema = mongoose.model('Schema', marketSchema);

export default Schema;
