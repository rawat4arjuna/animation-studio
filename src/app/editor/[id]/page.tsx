"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AnimationStudio from "@/components/AnimationStudio";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description?: string;
  fps: number;
  frames?: Array<{
    id: string;
    frameIndex: number;
    imageData: string;
    thumbnail: string;
  }>;
}

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchProject(params.id as string);
    }
  }, [params.id]);

  const fetchProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
      } else {
        setError("Project not found");
      }
    } catch (error) {
      console.error("Failed to fetch project:", error);
      setError("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const saveFrame = async (
    frameIndex: number,
    imageData: string,
    thumbnail: string
  ) => {
    if (!project) return;

    try {
      const response = await fetch(`/api/projects/${project.id}/frames`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frameIndex,
          imageData,
          thumbnail,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update local project state
        setProject((prev) => {
          if (!prev) return prev;
          const updatedFrames = [...(prev.frames || [])];
          const existingIndex = updatedFrames.findIndex(
            (f) => f.frameIndex === frameIndex
          );
          if (existingIndex >= 0) {
            updatedFrames[existingIndex] = data.frame;
          } else {
            updatedFrames.push(data.frame);
            updatedFrames.sort((a, b) => a.frameIndex - b.frameIndex);
          }
          return { ...prev, frames: updatedFrames };
        });
      }
    } catch (error) {
      console.error("Failed to save frame:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push("/")}
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                ← Back to Projects
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-sm text-gray-600">{project.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Play className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-blue-600">
                  {project.fps} FPS
                </span>
              </div>
              <Badge className="bg-blue-600 text-white border-0">
                {project.frames?.length || 0} frames
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Animation Studio */}
      <AnimationStudio
        projectId={project.id}
        initialFrames={project.frames || []}
        fps={project.fps}
        onSaveFrame={saveFrame}
      />
    </div>
  );
}
