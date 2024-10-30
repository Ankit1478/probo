import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Home, Briefcase, Bell } from 'lucide-react'
import Image from 'next/image'

const categories = ["All events", "Cricket", "Crypto", "Kabaddi", "News", "Economy", "Elections", "Youtube", "Football", "Stocks", "Basketball", "Motorsports", "Tennis", "Probo"]
const events = [
  { name: "SL-AvAF-A", icon: "🏏" },
  { name: "Bitcoin", icon: "₿", live: true },
  { name: "YouTube", icon: "▶️", live: true },
  { name: "RMAVBAR", icon: "⚽" },
  { name: " KABADDI", icon: "🤼" },
  { name: "EPL: GW 9", icon: "⚽" },
  { name: "F1- Mexico GP", icon: "🏎️" },
  { name: "NBA", icon: "🏀" },
]

export default function TradingPlatform() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">probo.</h1>
          <nav className="flex items-center space-x-4">
            <Button variant="ghost" size="icon"><Home className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon"><Briefcase className="h-5 w-5" /></Button>
            <span className="font-semibold">₹6.5</span>
            <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
          </nav>
        </div>
      </header>

      <nav className="border-b">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex p-4">
            {categories.map((category) => (
              <Button key={category} variant="ghost" className="mx-1 px-4">
                {category}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </nav>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex p-4">
          {events.map((event) => (
            <Card key={event.name} className="inline-block mx-2 w-40">
              <CardContent className="flex items-center p-2">
                <span className="text-2xl mr-2">{event.icon}</span>
                <div>
                  <div className="font-semibold">{event.name}</div>
                  {event.live && <span className="text-xs text-red-500">LIVE</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            <h2 className="text-2xl font-bold mb-4">Top Stories</h2>
            <Card>
              <CardHeader>
                <CardTitle>Tax Refund for states to be increased by the 16th Finance Commission?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Image src="https://probo.in/_next/image?url=https%3A%2F%2Fgumlet-images-bucket.s3.ap-south-1.amazonaws.com%2Fprobo_product_images%2FIMAGE_f19f81af-fdf7-47da-b360-c990246b148f.png&w=128&q=75" alt="Tax icon" width={40} height={40} className="mr-2" />
                    <div>
                      <div className="font-bold text-blue-500">90%</div>
                      <div className="text-sm text-muted-foreground">PROBABILITY OF YES</div>
                    </div>
                  </div>
                  <Button variant="outline" className="text-red-500">No</Button>
                </div>
                <p className="text-sm mb-4">
                  The 15th Finance Commission had recommended 41% of the tax funds collected by states to be paid to the states
                </p>
                <p className="text-sm mb-4">
                  The finance ministers of these participating states agreed with Vijayan that states need to receive more funds from the Centre. Vijayan said that, as per Article 270 of <Button variant="link" className="p-0">Read more</Button>
                </p>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">518 Traders</div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="text-blue-500">Yes ₹ 9.0</Button>
                    <Button variant="outline" className="text-red-500">No ₹ 1.0</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:w-1/3">
            <Card className="mb-4">
              <CardContent className="p-4">
                <h3 className="font-bold mb-2">DOWNLOAD APP FOR BETTER & FAST EXPERIENCE</h3>
                <Button className="w-full">Download Now</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Featured Stories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Image src="https://probo.in/_next/image?url=https%3A%2F%2Fgumlet-images-bucket.s3.ap-south-1.amazonaws.com%2Fprobo_product_images%2FIMAGE_102e1dec-1cec-458f-a17f-3718bb1d4eed.png&w=256&q=75" alt="Cricket jersey" width={60} height={60} className="mr-4" />
                  <div>
                    <div className="text-sm font-semibold text-blue-500">Cricket</div>
                    <div className="font-bold">Pakistan to win the 2nd Test vs Bangladesh?</div>
                    <div className="text-sm text-muted-foreground">October 27th 2024</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}