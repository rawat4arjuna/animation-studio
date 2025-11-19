'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Film, Zap, ShieldCheck } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Film className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Animation Studio
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <a href="/login" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                Login
              </a>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                <a href="/signup">Get Started Free</a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Badge
          variant="outline"
          className="mb-4 border-blue-300 bg-blue-50 text-blue-700 font-medium"
        >
          Powerful Frame-by-Frame Animation Software
        </Badge>
        <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
          Bring Your Ideas to Life with Animation
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-10">
          Create stunning frame-by-frame animations with professional tools, onion skinning, and a powerful editor. Perfect for hobbyists and professionals alike.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6 shadow-lg">
            <a href="/signup">Start Animating Now</a>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 border-gray-300 hover:bg-gray-100">
            <a href="#features">Learn More</a>
          </Button>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-gray-900">Why Choose Animation Studio?</h3>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Our platform is packed with features to make your animation workflow seamless and enjoyable.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Powerful Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  From advanced drawing tools to onion skinning and layer management, we provide everything you need to create professional-quality animations.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Film className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Cloud-Based</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Access your projects from anywhere. All your work is saved securely in the cloud, so you never lose a frame.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle>Secure & Reliable</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Built on a robust and scalable infrastructure, ensuring your data is always safe and your experience is smooth.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Animation Studio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
