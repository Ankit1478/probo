"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
    const router = useRouter()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold">probo.</h1>
        
          </div>
          <div className="flex items-center space-x-4">
        
            <Button variant="outline">Download App</Button>
            <Button type="button" onClick={() => router.push('/homes')}>Trade Online </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <div className="lg:w-1/2 mb-8 lg:mb-0">
            <h2 className="text-5xl font-bold mb-4">Invest in your<br />point of view</h2>
            <p className="text-xl mb-8">Sports, Entertainment, Economy or Finance.</p>
            <div className="flex space-x-4">
              <Button size="lg">Download App</Button>
              <Button size="lg" variant="outline" type="button" onClick={() => router.push('/homes')}>Trade Online</Button>
            </div>
            <div className="flex items-center mt-4">
              <input type="checkbox" id="age-check" className="mr-2" />
              <label htmlFor="age-check" className="text-sm">For 18 years and above only</label>
            </div>
          </div>
          <div className="lg:w-1/2 relative">
            <Image
              src=""
              alt="Thoughtful investor"
              width={400}
              height={400}
              className="rounded-lg"
            />
            <Card className="absolute top-0 left-0 w-64 p-4 bg-background/80 backdrop-blur-sm">
              <h3 className="font-bold mb-2">Who will win the US Presidential Elections in 2024?</h3>
              <p className="text-sm">The U.S. presidential election is on November 5, 2024. Joe Biden (Democrat) is running for re-election against Donald Trump (Republican).</p>
            </Card>
            <Card className="absolute bottom-0 right-0 w-64 p-4 bg-background/80 backdrop-blur-sm">
              <h3 className="font-bold mb-2">Will India enter into recession in the year 2024?</h3>
              <p className="text-sm">India's Finance Minister has said a recession may appear in 2024 due to uncertainties related to higher food and energy prices.</p>
            </Card>
          </div>
        </div>
        <div className="mt-12">
          <h3 className="text-xl font-bold mb-4">Trading Activity</h3>
          <div className="h-64 bg-muted rounded-lg flex items-end justify-between p-4">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="w-4 bg-primary" style={{height: `${Math.random() * 100}%`}}></div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}