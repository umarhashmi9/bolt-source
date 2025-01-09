import { useGetUser } from '~/lib/hooks/useGetUser';

function Avatar() {
  const { user } = useGetUser();
  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase();

  if (user)
    return (
      <div className="fixed top-0 md:bottom-0 max-md:w-full z-10 flex flex-col items-end md:items-center justify-end px-2.5 py-3 cursor-default">
        {user?.githubId ? (
          <img
            src={`https://avatars.githubusercontent.com/u/${user?.githubId}?v=4`}
            alt="avatar"
            className="rounded-full w-7 h-7 cursor-default"
          />
        ) : user?.googleId ? (
          <img src={`${user.avatar}`} alt="avatar" className="rounded-full w-7 h-7" />
        ) : (
          <div
            className="size-7 text-white rounded-full flex item-center text-center justify-center"
            style={{ background: `${user.avatar}` }}
          >
            <span className="mt-[0.5px]">{getInitials(user.name)}</span>
          </div>
        )}
      </div>
    );
}

export default Avatar;
