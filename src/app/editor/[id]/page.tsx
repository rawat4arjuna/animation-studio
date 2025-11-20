
"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AnimationStudio from "@/components/AnimationStudio";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import { gql, useQuery, useMutation } from '@apollo/client';

const GET_PROJECT = gql`
  query GetProject($id: String!) {
    project(id: $id) {
      id
      name
      description
      fps
      frames {
        id
        frameIndex
        imageData
        thumbnail
      }
    }
  }
`;

const SAVE_FRAME = gql`
  mutation SaveFrame($projectId: String!, $frameIndex: Int!, $imageData: String!, $thumbnail: String!) {
    saveFrame(projectId: $projectId, frameIndex: $frameIndex, imageData: $imageData, thumbnail: $thumbnail) {
      id
    }
  }
`;

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data, loading, error, refetch } = useQuery(GET_PROJECT, {
    variables: { id: projectId },
    skip: !projectId,
  });

  const [saveFrame] = useMutation(SAVE_FRAME, {
    refetchQueries: [{ query: GET_PROJECT, variables: { id: projectId } }],
  });

  useEffect(() => {
    if (error && error.message.includes('Not authenticated')) {
      router.push('/login');
    }
  }, [error, router]);

  const handleSaveFrame = async (frameIndex: number, imageData: string, thumbnail: string) => {
    try {
      await saveFrame({ variables: { projectId, frameIndex, imageData, thumbnail } });
    } catch (err) {
      console.error("Failed to save frame:", err);
      // Optionally, show a toast notification to the user
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">...</div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">...</div>
    );
  }

  const project = data?.project;

  if (!project) {
    return null; // Or some other placeholder
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button onClick={() => router.push("/dashboard")} className="text-gray-600 hover:text-gray-800 font-medium transition-colors">← Back to Projects</button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
              {project.description && <p className="text-sm text-gray-600">{project.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1"><Play className="w-4 h-4 text-gray-500" /><span className="font-medium text-blue-600">{project.fps} FPS</span></div>
              <Badge className="bg-blue-600 text-white border-0">{project.frames?.length || 0} frames</Badge>
            </div>
          </div>
        </div>
      </div>

      <AnimationStudio
        projectId={project.id}
        initialFrames={project.frames || []}
        fps={project.fps}
        onSaveFrame={handleSaveFrame}
      />
    </div>
  );
}
