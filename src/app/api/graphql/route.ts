
import { createYoga, createSchema } from 'graphql-yoga'
import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { jwtDecode } from 'jwt-decode';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

// Helper to get user from token
const getUser = async (req: NextApiRequest) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
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
        me: User
      }

      type Mutation {
        createProject(name: String!, description: String, fps: Int): Project
        deleteProject(id: String!): Project
        updateProject(id: String!, name: String, description: String, fps: Int): Project
        saveFrame(projectId: String!, frameIndex: Int!, imageData: String!, thumbnail: String!): Frame
        deleteFrame(id: String!): Frame
        signup(name: String!, email: String!, password: String!): User
        login(email: String!, password: String!): AuthPayload
      }

      type User {
        id: String!
        name: String
        email: String
        image: String
      }

      type AuthPayload {
        token: String!
        user: User!
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
        me: async (_, __, { req }) => {
          return getUser(req);
        },
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
        signup: async (_, { name, email, password }) => {
          const existingUser = await prisma.user.findUnique({ where: { email } });
          if (existingUser) {
            throw new Error('Email is already in use');
          }

          const hashedPassword = await bcrypt.hash(password, 10);

          const user = await prisma.user.create({
            data: {
              name,
              email,
              password: hashedPassword,
            },
          });

          return user;
        },
        login: async (_, { email, password }) => {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || !user.password) {
            throw new Error('Invalid credentials');
          }

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            throw new Error('Invalid credentials');
          }

          const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

          return {
            token,
            user,
          };
        },
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
        saveFrame: async (_, { projectId, frameIndex, imageData, thumbnail }, { req }) => {
          const user = await getUser(req);
          if (!user) throw new Error('Not authenticated');

          const project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } });
          if (!project) throw new Error('Project not found');
          
          const existingFrame = await prisma.frame.findFirst({ where: { projectId, frameIndex } });

          if (existingFrame) {
             return prisma.frame.update({
              where: { id: existingFrame.id },
              data: { imageData, thumbnail },
            });
          } else {
            return prisma.frame.create({
              data: { projectId, frameIndex, imageData, thumbnail },
            });
          }
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
