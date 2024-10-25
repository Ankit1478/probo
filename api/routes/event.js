import express from 'express';
const router = express.Router();
import Schema from '../db/schems.js';


router.post("/creat",async(req,res)=>{
    const { stockSymbol, endTime, description, sourceOfTrade } = req.body;
  
    const newMarket = new Schema({
      symbol: stockSymbol,
      endTime: new Date(endTime),
      description: description,
      sourceOfTrade: sourceOfTrade,
    });
  
    try {
      const market = await newMarket.save();
      res.status(200).json({ market });
    } catch (error) {
      console.error("Error creating market event:", error);
      res.status(500).json({ error: "An error occurred while creating the event." });
    }
  })


  export default router;