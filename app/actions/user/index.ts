import type { User } from '@prisma/client';
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
      ...(user.googleId && { googleId: user.googleId }),
      ...(user.githubId && { githubId: user.githubId }),
      ...(user.password && { password: user.password }),
    },
    update: {
      ...(user.email && { email: user.email }),
      ...(user.name && { name: user.name }),
      ...(user.googleId && { googleId: user.googleId }),
      ...(user.githubId && { githubId: user.githubId }),
      ...(user.password && { password: user.password }),
    },
  });
  return newUser;
};

export async function getCustomerByUserId(userId: string) {
  return await db.user.findUnique({
    where: { id: userId },
    select: { customerIs: true },
  });
}
export async function saveStripeCustomerId(userId: string, stripeCustomerId: string) {
  return await db.user.update({
    where: { id: userId },
    data: { customerIs: stripeCustomerId },
  });
}
