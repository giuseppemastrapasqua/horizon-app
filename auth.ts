import { createHash } from "node:crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  consumeRateLimit,
  createRateLimitKey,
} from "@/lib/security/rate-limiter";
import type { UserRole } from "@prisma/client";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const parsedCredentials = credentialsSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const email = parsedCredentials.data.email.trim().toLowerCase();
        const password = parsedCredentials.data.password;

        const loginRateLimit = await consumeRateLimit({
          key: createRateLimitKey("login", email),
          limit: 5,
          windowSeconds: 10 * 60,
        });

        if (!loginRateLimit.allowed) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            passwordHash: true,
            role: true,
            status: true,
          },
        });

        if (!user || !user.passwordHash || user.status !== "ACTIVE") {
          return null;
        }

        const passwordIsValid = await compare(password, user.passwordHash);

        if (!passwordIsValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.fullName,
          email: user.email,
          role: user.role,
          credentialVersion: createHash("sha256")
            .update(user.passwordHash)
            .digest("hex"),
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.credentialVersion = user.credentialVersion;
      }

      if (typeof token.id !== "string") return null;
      const currentUser = await prisma.user.findUnique({
        where: { id: token.id },
        select: {
          id: true,
          role: true,
          status: true,
          fullName: true,
          email: true,
          passwordHash: true,
        },
      });
      if (
        !currentUser ||
        currentUser.status !== "ACTIVE" ||
        !currentUser.passwordHash
      )
        return null;
      const currentCredentialVersion = createHash("sha256")
        .update(currentUser.passwordHash)
        .digest("hex");
      if (token.credentialVersion !== currentCredentialVersion) return null;
      token.role = currentUser.role;
      token.name = currentUser.fullName;
      token.email = currentUser.email;
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }

      return session;
    },
  },
});
