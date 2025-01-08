import db from '~/actions/prisma';

export const loader = async ({ params }: { params: { id: string } }) => {
  const { id } = params;

  if (!id) {
    return Response.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const user = await db.user.findUnique({
      where: { id },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};
3;
