import { Link } from '@remix-run/react';
import { Fragment, useEffect, useState } from 'react';

function HeaderLoginButtons({ user }: any) {
  const [showButtons, setShowButtons] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButtons(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!user && showButtons) {
    return (
      <Fragment>
        <div className="flex gap-2">
          <Link
            to="/sign-in"
            className="text-bolt-elements-textPrimary px-[16px] py-[6px] rounded-md text-xs bg-[#3B3B3B]"
          >
            Sign In
          </Link>
          <Link
            to="/sign-up"
            className="text-bolt-elements-textPrimary px-[16px] py-[6px] rounded-md text-xs bg-[#9E0DE1]"
          >
            Get Started
          </Link>
        </div>
      </Fragment>
    );
  }
}

export default HeaderLoginButtons;
