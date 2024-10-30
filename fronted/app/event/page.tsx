"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Home, ChevronRight, Plus, Minus, ChevronDown, AlertCircle } from 'lucide-react'
import Image from 'next/image'

const orderBookData = [
  { priceYes: 7, qtyYes: 425875, priceNo: 3.5, qtyNo: 364086 },
  { priceYes: 7.5, qtyYes: 289114, priceNo: 4, qtyNo: 242591 },
  { priceYes: 8, qtyYes: 103674, priceNo: 4.5, qtyNo: 72311 },
  { priceYes: 8.5, qtyYes: 93673, priceNo: 5, qtyNo: 50483 },
  { priceYes: 9, qtyYes: 118793, priceNo: 5.5, qtyNo: 56327 },
]

export default function EventDetails() {
  const [betPrice, setBetPrice] = useState(7.0)
  const [betQuantity, setBetQuantity] = useState(1)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">probo.</h1>
            <Button variant="ghost">Home</Button>
            <Button variant="ghost">Portfolio</Button>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">For 18 years and above only</span>
            <Button variant="outline">Download App</Button>
            <span className="font-semibold">₹6.5</span>
            <Button variant="ghost" size="icon">
              <Image src="/placeholder.svg" alt="User" width={32} height={32} className="rounded-full" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <Home className="h-4 w-4 mr-2" />
          <span>Home</span>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span>Event Details</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            <div className="flex items-center mb-4">
              <Image src="/placeholder.svg" alt="Cricket jersey" width={80} height={80} className="mr-4" />
              <h2 className="text-2xl font-bold">India Women to win the 2nd ODI vs New Zealand Women?</h2>
              <Button variant="ghost" size="icon" className="ml-auto">
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            <Tabs defaultValue="orderbook">
              <TabsList>
                <TabsTrigger value="orderbook">Orderbook</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="overview">Overview</TabsTrigger>
              </TabsList>
              <TabsContent value="orderbook">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Tabs defaultValue="order-book">
                        <TabsList>
                          <TabsTrigger value="order-book">Order Book</TabsTrigger>
                          <TabsTrigger value="activity">Activity</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <table className="w-full">
                      <thead>
                        <tr className="text-muted-foreground">
                          <th className="text-left">PRICE</th>
                          <th className="text-right">QTY AT YES</th>
                          <th className="text-left">PRICE</th>
                          <th className="text-right">QTY AT NO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderBookData.map((row, index) => (
                          <tr key={index}>
                            <td className="text-left">{row.priceYes}</td>
                            <td className="text-right bg-blue-100">{row.qtyYes}</td>
                            <td className="text-left">{row.priceNo}</td>
                            <td className="text-right bg-red-100">{row.qtyNo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:w-1/3">
            <Card>
              <CardHeader className="bg-gray-800 text-white">
                <CardTitle className="text-sm">Starts on 27 Oct, 01:30 PM</CardTitle>
                <div className="flex justify-between mt-2">
                  <span>IND-W</span>
                  <span>NZ-W</span>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex justify-between mb-4">
                  <Button className="w-1/2 bg-blue-500 text-white">Yes ₹6.5</Button>
                  <Button variant="outline" className="w-1/2">No ₹3.5</Button>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Set price</label>
                  <div className="flex items-center">
                    <Button variant="outline" size="icon" onClick={() => setBetPrice(prev => Math.max(0, prev - 0.5))}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={betPrice}
                      onChange={(e) => setBetPrice(parseFloat(e.target.value))}
                      className="mx-2 text-center"
                    />
                    <Button variant="outline" size="icon" onClick={() => setBetPrice(prev => prev + 0.5)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground">425875 qty available</span>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <div className="flex items-center">
                    <Button variant="outline" size="icon" onClick={() => setBetQuantity(prev => Math.max(1, prev - 1))}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={betQuantity}
                      onChange={(e) => setBetQuantity(parseInt(e.target.value))}
                      className="mx-2 text-center"
                    />
                    <Button variant="outline" size="icon" onClick={() => setBetQuantity(prev => prev + 1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between text-sm mb-4">
                  <div>
                    <div>₹{betPrice * betQuantity}</div>
                    <div className="text-muted-foreground">You put</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-600">₹{(10 - betPrice) * betQuantity}</div>
                    <div className="text-muted-foreground">You get</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full justify-between">
                  Advanced Options
                  <ChevronDown className="h-4 w-4" />
                </Button>
                
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}