
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, Edit, Play, Calendar, Film } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import TopBar from '@/components/dashboard/TopBar';
import Sidebar from '@/components/dashboard/Sidebar';

// GraphQL client helper
async function graphqlRequest(query: string, variables: any = {}) {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const { data, errors } = await response.json();
  if (errors) {
    console.error('GraphQL errors:', errors);
    throw new Error('GraphQL request failed');
  }

  return data;
}

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  frameCount: number;
  fps: number;
  createdAt: string;
  updatedAt: string;
  frames?: Array<{
    id: string;
    frameIndex: number;
    thumbnail?: string;
  }>;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    fps: 12,
  });
  const [creating, setCreating] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const decodedToken: User = jwtDecode(token);
      setUser(decodedToken);
      fetchProjects();
    } catch (error) {
      console.error('Invalid token:', error);
      router.push('/login');
    }
  }, [router]);

  const fetchProjects = async () => {
    setLoading(true);
    const query = `
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
    try {
      const data = await graphqlRequest(query);
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProject.name.trim()) return;

    setCreating(true);
    const mutation = `
      mutation CreateProject($name: String!, $description: String, $fps: Int) {
        createProject(name: $name, description: $description, fps: $fps) {
          id
        }
      }
    `;
    try {
      const data = await graphqlRequest(mutation, newProject);
      if (data.createProject) {
        // Redirect to the new project editor page
        router.push(`/editor/${data.createProject.id}`);
        setIsCreateDialogOpen(false);
        setNewProject({ name: '', description: '', fps: 12 });
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setCreating(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    const mutation = `
      mutation DeleteProject($id: String!) {
        deleteProject(id: $id) {
          id
        }
      }
    `;
    try {
      await graphqlRequest(mutation, { id: projectId });
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const openProject = (projectId: string) => {
    router.push(`/editor/${projectId}`);
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
                    Start a new animation project with professional drawing tools.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Project Name *</label>
                    <Input
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      placeholder="My Animation Project"
                      className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <Textarea
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      placeholder="Describe your animation project..."
                      className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Frame Rate (FPS)</label>
                    <select
                      value={newProject.fps}
                      onChange={(e) => setNewProject({ ...newProject, fps: parseInt(e.target.value) })}
                      className="mt-1 w-full p-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value={12}>12 FPS (Standard)</option>
                      <option value={24}>24 FPS (Cinema)</option>
                      <option value={30}>30 FPS (Smooth)</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createProject}
                      disabled={!newProject.name.trim() || creating}
                      className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                    >
                      {creating ? 'Creating...' : 'Create Project'}
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
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No projects yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">Create your first animation project to get started!</p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-md flex items-center gap-2 mx-auto text-lg px-6 py-3"
              >
                <Plus className="w-5 h-5" />
                Create Your First Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="group hover:shadow-lg transition-shadow duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 overflow-hidden border border-gray-300 dark:border-gray-600">
                      {project.thumbnail || (project.frames && project.frames[0]?.thumbnail) ? (
                        <img
                          src={project.thumbnail || project?.frames?.[0]?.thumbnail}
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
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          {format(new Date(project.updatedAt), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Play className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-blue-600">{project.fps} FPS</span>
                        </div>
                      </div>
                      <Badge className="bg-blue-600 text-white border-0">
                        {project.frameCount} {project.frameCount === 1 ? 'frame' : 'frames'}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openProject(project.id)}
                        className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Open
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteProject(project.id)
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50 border-red-200 dark:border-red-800 transition-colors"
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
