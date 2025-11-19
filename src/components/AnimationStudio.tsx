'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Pen, 
  Square, 
  Circle, 
  PaintBucket, 
  Eraser,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Plus,
  Trash2,
  Copy,
  Layers,
  Eye,
  EyeOff,
  Download,
  Upload,
  Undo,
  Redo
} from 'lucide-react'

interface Frame {
  id: string
  frameIndex: number
  imageData: string
  thumbnail: string
}

interface DrawingTool {
  type: 'pen' | 'rectangle' | 'circle' | 'fill' | 'eraser'
  size: number
  color: string
}

interface AnimationStudioProps {
  projectId: string
  initialFrames?: Frame[]
  fps: number
  onSaveFrame: (frameIndex: number, imageData: string, thumbnail: string) => void
}

export default function AnimationStudio({ 
  projectId, 
  initialFrames = [], 
  fps: initialFps,
  onSaveFrame 
}: AnimationStudioProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentTool, setCurrentTool] = useState<DrawingTool['type']>('pen')
  const [brushSize, setBrushSize] = useState(2)
  const [currentColor, setCurrentColor] = useState('#000000')
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null)
  const [canvasSnapshot, setCanvasSnapshot] = useState<ImageData | null>(null)
  const [frames, setFrames] = useState<Frame[]>(initialFrames)
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [fps, setFps] = useState(initialFps)
  const [onionSkinEnabled, setOnionSkinEnabled] = useState(true)
  const [onionSkinOpacity, setOnionSkinOpacity] = useState(0.3)
  const [history, setHistory] = useState<ImageData[]>([])
  const [historyStep, setHistoryStep] = useState(-1)
  const animationRef = useRef<number>(null)
  const lastFrameTime = useRef<number>(0)

  const createEmptyFrame = useCallback((): Frame | null => {
    if (typeof window === 'undefined') return null
    
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    return {
      id: Date.now().toString(),
      frameIndex: frames.length,
      imageData: canvas.toDataURL(),
      thumbnail: canvas.toDataURL()
    }
  }, [frames.length])

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    
    const newHistory = history.slice(0, historyStep + 1)
    newHistory.push(imageData)
    setHistory(newHistory)
    setHistoryStep(newHistory.length - 1)
  }, [history, historyStep])

  const saveCurrentFrame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const currentFrame = frames[currentFrameIndex]
    const imageData = canvas.toDataURL()
    const thumbnail = createThumbnail(imageData)
    
    // Save to database via parent callback
    onSaveFrame(currentFrameIndex, imageData, thumbnail)
    
    // Update local state
    const updatedFrame = {
      ...currentFrame,
      imageData,
      thumbnail
    }
    
    const newFrames = [...frames]
    newFrames[currentFrameIndex] = updatedFrame
    setFrames(newFrames)
  }, [frames, currentFrameIndex, onSaveFrame])

  const createThumbnail = (dataUrl: string): string => {
    const img = new Image()
    img.src = dataUrl
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 75
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, 100, 75)
    return canvas.toDataURL()
  }

  const loadFrame = useCallback((index: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')!
    const frame = frames[index]
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
    }
    img.src = frame?.imageData
    setCurrentFrameIndex(index)
  }, [frames])

  const drawOnionSkin = useCallback(() => {
    if (!onionSkinEnabled || currentFrameIndex === 0) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')!
    
    // Draw previous frame with opacity
    if (currentFrameIndex > 0) {
      const prevFrame = frames[currentFrameIndex - 1]
      const img = new Image()
      img.onload = () => {
        ctx.save()
        ctx.globalAlpha = onionSkinOpacity
        ctx.drawImage(img, 0, 0)
        ctx.restore()
      }
      img.src = prevFrame.imageData
    }
    
    // Draw next frame with opacity
    if (currentFrameIndex < frames.length - 1) {
      const nextFrame = frames[currentFrameIndex + 1]
      const img = new Image()
      img.onload = () => {
        ctx.save()
        ctx.globalAlpha = onionSkinOpacity * 0.5
        ctx.drawImage(img, 0, 0)
        ctx.restore()
      }
      img.src = nextFrame.imageData
    }
  }, [onionSkinEnabled, currentFrameIndex, frames, onionSkinOpacity])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    
    setIsDrawing(true)
    saveToHistory()
    
    // Store start point for shape tools
    if (currentTool === 'rectangle' || currentTool === 'circle') {
      setStartPoint({ x, y })
      // Save canvas state before drawing shape
      const ctx = canvas.getContext('2d')!
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      setCanvasSnapshot(imageData)
    }
    
    const ctx = canvas.getContext('2d')!
    
    if (currentTool === 'pen' || currentTool === 'eraser') {
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    
    // Update current point for shape preview
    if (isDrawing && (currentTool === 'rectangle' || currentTool === 'circle')) {
      setCurrentPoint({ x, y })
    }
    
    if (isDrawing) {
      const ctx = canvas.getContext('2d')!
      
      if (currentTool === 'pen' || currentTool === 'eraser') {
        ctx.lineWidth = brushSize
        ctx.lineCap = 'round'
        
        switch (currentTool) {
          case 'pen':
            ctx.globalCompositeOperation = 'source-over'
            ctx.strokeStyle = currentColor
            ctx.lineTo(x, y)
            ctx.stroke()
            break
            
          case 'eraser':
            ctx.globalCompositeOperation = 'destination-out'
            ctx.lineTo(x, y)
            ctx.stroke()
            break
        }
      }
    }
  }

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    
    const ctx = canvas.getContext('2d')!
    ctx.globalCompositeOperation = 'source-over'
    
    switch (currentTool) {
      case 'rectangle':
        if (startPoint && canvasSnapshot) {
          // Restore original canvas first
          ctx.putImageData(canvasSnapshot, 0, 0)
          
          // Draw final rectangle
          ctx.strokeStyle = currentColor
          ctx.lineWidth = brushSize
          ctx.setLineDash([]) // Solid lines for final shape
          let width = x - startPoint.x
          let height = y - startPoint.y
          
          // Limit maximum size to prevent huge rectangles
          const maxSize = 400
          width = Math.max(-maxSize, Math.min(maxSize, width))
          height = Math.max(-maxSize, Math.min(maxSize, height))
          
          ctx.strokeRect(startPoint.x, startPoint.y, width, height)
        }
        break
        
      case 'circle':
        if (startPoint && canvasSnapshot) {
          // Restore original canvas first
          ctx.putImageData(canvasSnapshot, 0, 0)
          
          // Draw final circle
          ctx.strokeStyle = currentColor
          ctx.lineWidth = brushSize
          ctx.setLineDash([]) // Solid lines for final shape
          let radius = Math.sqrt(
            Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2)
          )
          
          // Limit maximum radius to prevent huge circles
          const maxRadius = 200
          radius = Math.min(radius, maxRadius)
          
          ctx.beginPath()
          ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI)
          ctx.stroke()
        }
        break
        
      case 'fill':
        floodFill(ctx, Math.floor(x), Math.floor(y), currentColor)
        break
    }
    
    setIsDrawing(false)
    setStartPoint(null)
    setCurrentPoint(null)
    setCanvasSnapshot(null)
    saveCurrentFrame()
  }

  const floodFill = (ctx: CanvasRenderingContext2D, startX: number, startY: number, fillColor: string) => {
    const canvas = ctx.canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    
    const targetColor = getPixel(imageData, startX, startY)
    const fillColorRgb = hexToRgb(fillColor)
    
    // Don't fill if colors are the same
    if (colorsMatch(targetColor, fillColorRgb)) return
    
    const pixelsToCheck: number[] = [startX, startY]
    const width = canvas.width
    const height = canvas.height
    const visited = new Set<string>()
    
    while (pixelsToCheck.length > 0) {
      const y = pixelsToCheck.pop()!
      const x = pixelsToCheck.pop()!
      
      const key = `${x},${y}`
      if (visited.has(key)) continue
      visited.add(key)
      
      // Check bounds
      if (x < 0 || x >= width || y < 0 || y >= height) continue
      
      const currentColor = getPixel(imageData, x, y)
      if (!colorsMatch(currentColor, targetColor)) continue
      
      // Set the pixel
      setPixel(imageData, x, y, fillColorRgb)
      
      // Add neighboring pixels
      pixelsToCheck.push(x + 1, y)
      pixelsToCheck.push(x - 1, y)
      pixelsToCheck.push(x, y + 1)
      pixelsToCheck.push(x, y - 1)
    }
    
    ctx.putImageData(imageData, 0, 0)
  }

  const getPixel = (imageData: ImageData, x: number, y: number) => {
    const index = (y * imageData.width + x) * 4
    return {
      r: imageData.data[index],
      g: imageData.data[index + 1],
      b: imageData.data[index + 2],
      a: imageData.data[index + 3]
    }
  }

  const setPixel = (imageData: ImageData, x: number, y: number, color: { r: number, g: number, b: number }) => {
    const index = (y * imageData.width + x) * 4
    imageData.data[index] = color.r
    imageData.data[index + 1] = color.g
    imageData.data[index + 2] = color.b
    imageData.data[index + 3] = 255
  }

  const colorsMatch = (color1: any, color2: any) => {
    return color1.r === color2.r && 
           color1.g === color2.g && 
           color1.b === color2.b &&
           color1.a === color2.a
  }

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
      a: 255
    } : { r: 0, g: 0, b: 0, a: 255 }
  }

  const addNewFrame = () => {
    const newFrame = createEmptyFrame()
    if (!newFrame) return
    
    const newFrames = [...frames]
    newFrames.splice(currentFrameIndex + 1, 0, newFrame)
    setFrames(newFrames)
    setCurrentFrameIndex(currentFrameIndex + 1)
    loadFrame(currentFrameIndex + 1)
  }

  const duplicateFrame = () => {
    const currentFrame = frames[currentFrameIndex]
    const duplicatedFrame = {
      ...currentFrame,
      id: Date.now().toString(),
      frameIndex: currentFrameIndex + 1
    }
    const newFrames = [...frames]
    newFrames.splice(currentFrameIndex + 1, 0, duplicatedFrame)
    
    // Update frame indices for subsequent frames
    for (let i = currentFrameIndex + 2; i < newFrames.length; i++) {
      newFrames[i].frameIndex = i
    }
    
    setFrames(newFrames)
    setCurrentFrameIndex(currentFrameIndex + 1)
  }

  const deleteFrame = () => {
    if (frames.length <= 1) return
    
    const newFrames = frames.filter((_, index) => index !== currentFrameIndex)
    
    // Update frame indices
    for (let i = 0; i < newFrames.length; i++) {
      newFrames[i].frameIndex = i
    }
    
    setFrames(newFrames)
    
    if (currentFrameIndex >= newFrames.length) {
      setCurrentFrameIndex(newFrames.length - 1)
    }
    loadFrame(Math.max(0, currentFrameIndex - 1))
  }

  const animate = useCallback((timestamp: number) => {
    if (!lastFrameTime.current) lastFrameTime.current = timestamp
    
    const elapsed = timestamp - lastFrameTime.current
    const frameInterval = 1000 / fps
    
    if (elapsed >= frameInterval) {
      setCurrentFrameIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % frames.length
        loadFrame(nextIndex)
        return nextIndex
      })
      lastFrameTime.current = timestamp
    }
    
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate)
    }
  }, [fps, frames.length, isPlaying, loadFrame])

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      lastFrameTime.current = 0
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, animate])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || frames.length === 0) return
    
    // Initialize canvas only once when the first frame is created
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  // Load initial frame when frames are first populated
  useEffect(() => {
    if (frames.length > 0 && currentFrameIndex === 0) {
      loadFrame(0)
    }
  }, [frames.length, loadFrame, currentFrameIndex])

  // Load frame when currentFrameIndex changes (but not during initial load)
  useEffect(() => {
    if (frames.length > 0 && currentFrameIndex > 0) {
      loadFrame(currentFrameIndex)
    }
  }, [currentFrameIndex, frames, loadFrame])

  useEffect(() => {
    drawOnionSkin()
  }, [currentFrameIndex, drawOnionSkin])

  // Draw shape preview overlay
  useEffect(() => {
    if (!isDrawing || !startPoint || !currentPoint) return
    if (currentTool !== 'rectangle' && currentTool !== 'circle') return
    
    const canvas = canvasRef.current
    if (!canvas || !canvasSnapshot) return
    
    const ctx = canvas.getContext('2d')!
    
    // Restore canvas to original state (before shape drawing started)
    ctx.putImageData(canvasSnapshot, 0, 0)
    
    // Save current state
    ctx.save()
    
    // Set preview style - very visible like MS Paint
    ctx.strokeStyle = currentColor
    ctx.lineWidth = Math.max(2, brushSize) // Ensure minimum 2px visibility
    ctx.setLineDash([10, 5]) // Clear dash pattern
    ctx.globalAlpha = 1 // Full opacity for clear preview
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    if (currentTool === 'rectangle') {
      let width = currentPoint.x - startPoint.x
      let height = currentPoint.y - startPoint.y
      
      // Limit preview size
      const maxSize = 400
      width = Math.max(-maxSize, Math.min(maxSize, width))
      height = Math.max(-maxSize, Math.min(maxSize, height))
      
      // Draw rectangle preview
      ctx.beginPath()
      ctx.moveTo(startPoint.x, startPoint.y)
      ctx.lineTo(startPoint.x + width, startPoint.y)
      ctx.lineTo(startPoint.x + width, startPoint.y + height)
      ctx.lineTo(startPoint.x, startPoint.y + height)
      ctx.closePath()
      ctx.stroke()
      
      // Add corner dots for better visibility (like MS Paint)
      ctx.fillStyle = currentColor
      ctx.globalAlpha = 1
      const dotSize = Math.max(4, brushSize + 1)
      
      // Four corners
      ctx.fillRect(startPoint.x - dotSize/2, startPoint.y - dotSize/2, dotSize, dotSize)
      ctx.fillRect(startPoint.x + width - dotSize/2, startPoint.y - dotSize/2, dotSize, dotSize)
      ctx.fillRect(startPoint.x + width - dotSize/2, startPoint.y + height - dotSize/2, dotSize, dotSize)
      ctx.fillRect(startPoint.x - dotSize/2, startPoint.y + height - dotSize/2, dotSize, dotSize)
      
    } else if (currentTool === 'circle') {
      let radius = Math.sqrt(
        Math.pow(currentPoint.x - startPoint.x, 2) + 
        Math.pow(currentPoint.y - startPoint.y, 2)
      )
      
      // Limit preview radius
      const maxRadius = 200
      radius = Math.min(radius, maxRadius)
      
      // Draw circle preview
      ctx.beginPath()
      ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI)
      ctx.stroke()
      
      // Add center dot for better visibility (like MS Paint)
      ctx.fillStyle = currentColor
      ctx.globalAlpha = 1
      const dotSize = Math.max(4, brushSize + 1)
      ctx.fillRect(startPoint.x - dotSize/2, startPoint.y - dotSize/2, dotSize, dotSize)
    }
    
    // Restore state
    ctx.restore()
  }, [isDrawing, startPoint, currentPoint, currentTool, currentColor, brushSize, canvasSnapshot])

  const exportAnimation = () => {
    // Create a simple animated GIF or video export
    const data = {
      frames: frames.map(f => f.imageData),
      fps: fps
    }
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'animation.json'
    a.click()
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Toolbar */}
        <Card className="lg:col-span-1 p-4 bg-white border-gray-200">
          <h3 className="font-bold mb-4 text-gray-900">Tools</h3>
          
          <ToggleGroup
            type="single"
            value={currentTool}
            onValueChange={(value: DrawingTool['type']) => value && setCurrentTool(value)}
            className="flex flex-col gap-2 mb-6"
          >
            <ToggleGroupItem value="pen" className="justify-start data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              <Pen className="w-4 h-4 mr-2" />
              Pen
            </ToggleGroupItem>
            <ToggleGroupItem value="rectangle" className="justify-start data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              <Square className="w-4 h-4 mr-2" />
              Rectangle
            </ToggleGroupItem>
            <ToggleGroupItem value="circle" className="justify-start data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              <Circle className="w-4 h-4 mr-2" />
              Circle
            </ToggleGroupItem>
            <ToggleGroupItem value="fill" className="justify-start data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              <PaintBucket className="w-4 h-4 mr-2" />
              Fill
            </ToggleGroupItem>
            <ToggleGroupItem value="eraser" className="justify-start data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              <Eraser className="w-4 h-4 mr-2" />
              Eraser
            </ToggleGroupItem>
          </ToggleGroup>
          
          <Separator className="my-4 bg-gray-200" />
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Color</label>
              <input
                type="color"
                value={currentColor}
                onChange={(e) => setCurrentColor(e.target.value)}
                className="w-full h-10 rounded cursor-pointer border-gray-300"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Brush Size: {brushSize}px</label>
              <Slider
                value={[brushSize]}
                onValueChange={(value) => setBrushSize(value[0])}
                max={50}
                min={1}
                className="mt-2"
              />
            </div>
          </div>
          
          <Separator className="my-4 bg-gray-200" />
          
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Undo logic here
              }}
              disabled={historyStep <= 0}
              className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Undo className="w-4 h-4 mr-2" />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Redo logic here
              }}
              disabled={historyStep >= history.length - 1}
              className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Redo className="w-4 h-4 mr-2" />
              Redo
            </Button>
          </div>
        </Card>
        
        {/* Canvas Area */}
        <Card className="lg:col-span-2 p-4 bg-white border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Canvas</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-300">
                Frame {currentFrameIndex + 1}/{frames.length}
              </Badge>
              {isDrawing && (currentTool === 'rectangle' || currentTool === 'circle') && (
                <Badge variant="outline" className="text-xs border-gray-600 text-gray-500">
                  {currentTool === 'rectangle' ? '📐 Drawing Rectangle' : '⭕ Drawing Circle'}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden relative bg-white">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className={`w-full bg-white ${
                currentTool === 'pen' ? 'cursor-crosshair' :
                currentTool === 'eraser' ? 'cursor-grab' :
                currentTool === 'fill' ? 'cursor-pointer' :
                currentTool === 'rectangle' || currentTool === 'circle' ? 'cursor-crosshair' :
                'cursor-default'
              }`}
              onMouseDown={startDrawing}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>
          
          {/* Playback Controls */}
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadFrame(Math.max(0, currentFrameIndex - 1))}
              disabled={isPlaying}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button
              variant={isPlaying ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className={isPlaying ? "bg-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadFrame(Math.min(frames.length - 1, currentFrameIndex + 1))}
              disabled={isPlaying}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
            
            <div className="flex-1 flex items-center gap-2 ml-4">
              <label className="text-sm font-medium text-gray-700">FPS:</label>
              <Slider
                value={[fps]}
                onValueChange={(value) => setFps(value[0])}
                max={30}
                min={12}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-medium w-8 text-gray-700">{fps}</span>
            </div>
          </div>
        </Card>
        
        {/* Frames Panel */}
        <Card className="lg:col-span-1 p-4 bg-white border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Frames</h3>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={addNewFrame}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={duplicateFrame}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deleteFrame}
                disabled={frames.length <= 1}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {frames.map((frame, index) => (
                <div
                  key={frame.id+"_frame"}
                  className={`p-2 border rounded-lg cursor-pointer transition-all duration-200 ${
                    index === currentFrameIndex
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  onClick={() => !isPlaying && loadFrame(index)}
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={frame.thumbnail}
                      alt={`Frame ${index + 1}`}
                      className="w-16 h-12 object-cover border rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700">Frame {index + 1}</div>
                    </div>
                    {index === currentFrameIndex && (
                      <Badge variant="default" className="bg-blue-600 text-white border-0 text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <Separator className="my-4 bg-gray-200" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Onion Skin</span>
              </div>
              <Button
                variant={onionSkinEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setOnionSkinEnabled(!onionSkinEnabled)}
                className={onionSkinEnabled ? "bg-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}
              >
                {onionSkinEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
            </div>
            
            {onionSkinEnabled && (
              <div>
                <label className="text-sm font-medium text-gray-700">Opacity: {Math.round(onionSkinOpacity * 100)}%</label>
                <Slider
                  value={[onionSkinOpacity]}
                  onValueChange={(value) => setOnionSkinOpacity(value[0])}
                  max={0.8}
                  min={0.1}
                  step={0.1}
                  className="mt-2"
                />
              </div>
            )}
          </div>
          
          <Separator className="my-4 bg-gray-200" />
          
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportAnimation}
              className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Animation
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}