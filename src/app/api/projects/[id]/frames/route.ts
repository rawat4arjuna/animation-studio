import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { frameIndex, imageData, thumbnail } = await request.json()

    if (!imageData || frameIndex === undefined) {
      return NextResponse.json(
        { error: 'Frame data and index are required' },
        { status: 400 }
      )
    }

    // Check if frame exists and update, or create new
    const existingFrame = await db.frame.findUnique({
      where: {
        projectId_frameIndex: {
          projectId: params.id,
          frameIndex
        }
      }
    })

    let frame
    if (existingFrame) {
      // Update existing frame
      frame = await db.frame.update({
        where: {
          id: existingFrame.id
        },
        data: {
          imageData,
          thumbnail
        }
      })
    } else {
      // Create new frame
      frame = await db.frame.create({
        data: {
          projectId: params.id,
          frameIndex,
          imageData,
          thumbnail
        }
      })

      // Update project frame count
      await db.project.update({
        where: { id: params.id },
        data: {
          frameCount: {
            increment: 1
          }
        }
      })
    }

    return NextResponse.json({ frame })
  } catch (error) {
    console.error('Error saving frame:', error)
    return NextResponse.json(
      { error: 'Failed to save frame' },
      { status: 500 }
    )
  }
}