import type { Prisma, User } from '@prisma/client';
import db from '../prisma';
import * as bcrypt from 'bcrypt';

export const createUser = async (user: User) => {
  if (user.password) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;
  }

  const newUser = await db.user.upsert({
    where: {
      name: user.name,
    },
    create: {
      ...(user.email && { email: user.email }),
      name: user.name,
      ...(user.avatar && { avatar: user.avatar }),
      ...(user.githubId && { githubId: user.githubId }),
      ...(user.password && { password: user.password }),
    },
    update: {
      ...(user.email && { email: user.email }),
      ...(user.name && { name: user.name }),
      ...(user.githubId && { githubId: user.githubId }),
      ...(user.password && { password: user.password }),
    },
  });
  return newUser;
};
