import { Link } from '@remix-run/react';

export const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-[rgba(43,43,43,0.1)] px-[159px] pt-[80px] pb-[210px]">
      <div className="flex items-start justify-between">
        {/* Left box */}
        <div className="grid gap-[15px]">
          <Link to="#" className="block">
            <img src="logo.svg" alt="AICre8 Logo" />
          </Link>
          <div className="inline-flex items-start gap-[16px]">
            <Link
              to="https://x.com/AICre8_com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn icon_btn p-0"
            >
              <img src="tw.svg" alt="Twitter" />
            </Link>
            <Link
              to="https://aicre8.gitbook.io/aicre8.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="git.svg" alt="GitBook" />
            </Link>
          </div>
        </div>

        {/* Right box */}
        <div className="inline-flex items-start gap-[64px]">
          {/* Column 1 */}
          <div className="flex flex-col items-start gap-[16px]">
            <h6 className="text-white text-[16px] font-bold leading-normal tracking-[-0.8px] m-0">Product</h6>
            <div className="flex flex-col items-start gap-[16px]">
              <Link to="/" className="text-white text-[16px] font-medium opacity-50 tracking-[-0.8px]">About</Link>
              <Link to="/" className="text-white text-[16px] font-medium opacity-50 tracking-[-0.8px]">News</Link>
              <Link to="/" className="text-white text-[16px] font-medium opacity-50 tracking-[-0.8px]">Partners</Link>
              <Link to="/" className="text-white text-[16px] font-medium opacity-50 tracking-[-0.8px]">Roadmap</Link>
            </div>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col items-start gap-[16px]">
            <h6 className="text-white text-[16px] font-bold leading-normal tracking-[-0.8px] m-0">Resources</h6>
            <div className="flex flex-col items-start gap-[16px]">
              <Link to="/" className="text-white text-[16px] font-medium opacity-50 tracking-[-0.8px]">Builder Hall of Fame</Link>
              <Link to="https://aicre8.gitbook.io/aicre8.com" className="text-white text-[16px] font-medium opacity-50 tracking-[-0.8px]">Docs</Link>
              <Link to="/" className="text-white text-[16px] font-medium opacity-50 tracking-[-0.8px]">Integrations</Link>
              <Link to="/" className="text-white text-[16px] font-medium opacity-50 tracking-[-0.8px]">Affiliates</Link>
            </div>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col items-start gap-[16px]">
            <h6 className="text-white text-[16px] font-bold leading-normal tracking-[-0.8px] m-0">Legal</h6>
            <div className="flex flex-col items-start gap-[16px]">
              <Link to="/" className="text-white text-[16px] font-medium opacity-50 tracking-[-0.8px]">Privacy Policy</Link>
              <Link to="/" className="text-white text-[16px] font-medium opacity-50 tracking-[-0.8px]">Terms & Conditions</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}; 