
import { createYoga, createSchema } from 'graphql-yoga'
import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma' // Import your Prisma client
import { jwtDecode } from 'jwt-decode';

// Helper to get user from token
const getUser = async (req: NextApiRequest) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;

  try {
    const decoded: { id: string } = jwtDecode(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    return user;
  } catch (error) {
    return null;
  }
};

const { handleRequest } = createYoga<{
  req: NextApiRequest;
  res: NextApiResponse;
}>({ 
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        projects: [Project!]
        project(id: String!): Project
      }

      type Mutation {
        createProject(name: String!, description: String, fps: Int): Project
        deleteProject(id: String!): Project
        updateProject(id: String!, name: String, description: String, fps: Int): Project
        createFrame(projectId: String!, frameIndex: Int!, imageData: String!, thumbnail: String!): Frame
        deleteFrame(id: String!): Frame
      }

      type Project {
        id: String!
        name: String!
        description: String
        thumbnail: String
        frameCount: Int!
        fps: Int!
        createdAt: String!
        updatedAt: String!
        frames: [Frame!]
      }

      type Frame {
        id: String!
        frameIndex: Int!
        imageData: String!
        thumbnail: String!
        createdAt: String!
      }
    `,
    resolvers: {
      Query: {
        projects: async (_, __, { req }) => {
          const user = await getUser(req);
          if (!user) throw new Error('Not authenticated');

          return prisma.project.findMany({ 
            where: { userId: user.id },
            orderBy: { updatedAt: 'desc' },
            include: { frames: { orderBy: { frameIndex: 'asc' } } }
          });
        },
        project: async (_, { id }, { req }) => {
          const user = await getUser(req);
          if (!user) throw new Error('Not authenticated');

          const project = await prisma.project.findFirst({
            where: { id, userId: user.id },
            include: { frames: { orderBy: { frameIndex: 'asc' } } }
          });

          if (!project) throw new Error('Project not found');
          return project;
        },
      },
      Mutation: {
        createProject: async (_, { name, description, fps }, { req }) => {
          const user = await getUser(req);
          if (!user) throw new Error('Not authenticated');

          return prisma.project.create({
            data: {
              name,
              description,
              fps: fps || 12,
              userId: user.id
            }
          });
        },
        deleteProject: async (_, { id }, { req }) => {
          const user = await getUser(req);
          if (!user) throw new Error('Not authenticated');

          await prisma.project.deleteMany({ where: { id, userId: user.id } });
          return { id }; // Return dummy object to satisfy GraphQL schema
        },
        updateProject: async (_, { id, name, description, fps }, { req }) => {
          const user = await getUser(req);
          if (!user) throw new Error('Not authenticated');

          return prisma.project.updateMany({
            where: { id, userId: user.id },
            data: { name, description, fps }
          }).then(() => prisma.project.findFirst({ where: { id } }));
        },
        createFrame: async (_, { projectId, frameIndex, imageData, thumbnail }, { req }) => {
          const user = await getUser(req);
          if (!user) throw new Error('Not authenticated');

          const project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } });
          if (!project) throw new Error('Project not found');

          return prisma.frame.create({
            data: { projectId, frameIndex, imageData, thumbnail }
          });
        },
        deleteFrame: async (_, { id }, { req }) => {
          const user = await getUser(req);
          if (!user) throw new Error('Not authenticated');
          
          await prisma.frame.deleteMany({ where: { id, project: { userId: user.id } } })
          return { id }; // Return dummy object
        },
      },
    },
  }),
  graphqlEndpoint: '/api/graphql',
  fetchAPI: {
    Request: Request,
    Response: Response
  }
});

export {
  handleRequest as GET,
  handleRequest as POST,
  handleRequest as OPTIONS
};
