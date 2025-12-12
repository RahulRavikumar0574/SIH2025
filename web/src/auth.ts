import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // Use JWT strategy for Credentials provider compatibility
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    // Student login (default)
    Credentials({
      id: "student-credentials",
      name: "Student Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.role !== "STUDENT") return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role } as any;
      },
    }),
    // Counsellor login (requires employeeId)
    Credentials({
      id: "counsellor-credentials",
      name: "Counsellor Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        employeeId: { label: "Employee ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.employeeId) return null;
        const email = credentials.email.toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.role !== "COUNSELLOR") return null;
        // We store Employee ID in the rollNo column
        if (!user.rollNo || user.rollNo !== credentials.employeeId) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role } as any;
      },
    }),
    // Admin login
    Credentials({
      id: "admin-credentials",
      name: "Admin Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.role !== "ADMIN") return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role } as any;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // On sign in, persist the user id to the token
      if (user) {
        ;(token as any).id = (user as any).id;
        ;(token as any).role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = (token as any).id;
        (session.user as any).role = (token as any).role;
      }
      return session;
    },
  },
};
