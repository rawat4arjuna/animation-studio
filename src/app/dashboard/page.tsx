"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Play, Calendar, Film } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import TopBar from "@/components/dashboard/TopBar";
import Sidebar from "@/components/dashboard/Sidebar";
import { gql, ApolloCache, FetchResult } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";

const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      id
      name
      description
      thumbnail
      frameCount
      fps
      createdAt
      updatedAt
      frames {
        id
        thumbnail
      }
    }
  }
`;

const CREATE_PROJECT = gql`
  mutation CreateProject($name: String!, $description: String, $fps: Int) {
    createProject(name: $name, description: $description, fps: $fps) {
      id
    }
  }
`;

const DELETE_PROJECT = gql`
  mutation DeleteProject($id: String!) {
    deleteProject(id: $id) {
      id
    }
  }
`;

type Project = {
  id: string;
  name: string;
  description?: string | null;
  thumbnail?: string | null;
  frameCount: number;
  fps: number;
  createdAt: string;
  updatedAt: string;
  frames?: Array<{ id: string; thumbnail?: string | null }>;
};

type GetProjectsData = {
  projects: Project[];
};

type CreateProjectData = {
  createProject: {
    id: string;
  } | null;
};

type CreateProjectVars = {
  name: string;
  description?: string | null;
  fps?: number | null;
};

type DeleteProjectData = {
  deleteProject: {
    id: string;
  } | null;
};

type DeleteProjectVars = {
  id: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState<CreateProjectVars>({
    name: "",
    description: "",
    fps: 12,
  });

  const { loading, error, data } = useQuery<GetProjectsData>(GET_PROJECTS);

  const [createProject, { loading: creating }] = useMutation<
    CreateProjectData,
    CreateProjectVars
  >(CREATE_PROJECT, {
    onCompleted: (res) => {
      const id = res?.createProject?.id;
      if (id) router.push(`/editor/${id}`);
    },
    refetchQueries: [{ query: GET_PROJECTS }],
    onError: (err) => {
      console.error("Failed to create project:", err);
    },
  });

  const [deleteProject] = useMutation<DeleteProjectData, DeleteProjectVars>(
    DELETE_PROJECT,
    {
      update(
        cache: ApolloCache,
        { data: result }: FetchResult<DeleteProjectData> = {}
      ) {
        const deletedProject = result?.deleteProject;
        if (!deletedProject) return;
        const existing = cache.readQuery<GetProjectsData>({ query: GET_PROJECTS });
        if (existing?.projects) {
          cache.writeQuery<GetProjectsData>({
            query: GET_PROJECTS,
            data: {
              projects: existing.projects.filter((p) => p.id !== deletedProject.id),
            },
          });
        }
      },
      onError: (err) => {
        console.error("Failed to delete project:", err);
      },
    }
  );

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  if (error) {
    if (error.message?.includes?.("Not authenticated")) {
      if (typeof window !== "undefined") localStorage.removeItem("token");
      router.push("/login");
      return null;
    }
    return <p>Error loading projects. Please try again later.</p>;
  }

  const handleCreateProject = () => {
    if (!newProject.name?.trim()) return;
    createProject({ variables: newProject });
  };

  const handleDeleteProject = (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    deleteProject({ variables: { id: projectId } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  const projects = data?.projects ?? [];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
              Your Projects
            </h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-md flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    Create New Animation Project
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-400">
                    Start a new animation project.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Project Name *
                    </label>
                    <Input
                      value={newProject.name || ""}
                      onChange={(e) =>
                        setNewProject({ ...newProject, name: e.target.value })
                      }
                      placeholder="My Animation Project"
                      className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <Textarea
                      value={newProject.description ?? ""}
                      onChange={(e) =>
                        setNewProject({ ...newProject, description: e.target.value })
                      }
                      placeholder="A short description..."
                      className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Frame Rate (FPS)
                    </label>
                    <select
                      value={newProject.fps ?? 12}
                      onChange={(e) =>
                        setNewProject({ ...newProject, fps: parseInt(e.target.value, 10) })
                      }
                      className="mt-1 w-full p-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value={12}>12 FPS (Standard)</option>
                      <option value={24}>24 FPS (Cinema)</option>
                      <option value={30}>30 FPS (Smooth)</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateProject}
                      disabled={!newProject.name?.trim() || creating}
                    >
                      {creating ? "Creating..." : "Create Project"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-16">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                  <Film className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                No projects yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                Create your first animation project to get started!
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md text-lg px-6 py-3"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project: Project) => (
                <Card
                  key={project.id}
                  className="group hover:shadow-lg transition-shadow duration-200 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                >
                  <CardHeader className="pb-3">
                    <div
                      className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 overflow-hidden border border-gray-300 dark:border-gray-600 cursor-pointer"
                      onClick={() => router.push(`/editor/${project.id}`)}
                    >
                      {project.thumbnail || project.frames?.[0]?.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={project.thumbnail || project.frames?.[0]?.thumbnail || ""}
                          alt={project.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {project.name}
                    </CardTitle>
                    {project.description && (
                      <CardDescription className="line-clamp-2 text-gray-600 dark:text-gray-400">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        {project.updatedAt
                          ? format(new Date(project.updatedAt), "MMM d, yyyy")
                          : "—"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Play className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-blue-600">{project.fps} FPS</span>
                      </div>
                      <Badge className="bg-blue-600 text-white">
                        {project.frameCount} {project.frameCount === 1 ? "frame" : "frames"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/editor/${project.id}`)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Open
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
