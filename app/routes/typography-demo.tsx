import type { MetaFunction } from '@remix-run/cloudflare';
import { Header } from '~/components/header/Header';
import { WelcomeMessage, CompactWelcome, HandwrittenAccent } from '~/components/ui/WelcomeMessage';

export const meta: MetaFunction = () => {
  return [
    { title: 'Typography Demo - Bolt' },
    { name: 'description', content: 'Showcase of handwritten typography using Indie Flower font' }
  ];
};

export default function TypographyDemo() {
  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <Header />
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8 space-y-12">
          
          {/* Page Title */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-bolt-elements-textPrimary mb-2">
              Typography Showcase
            </h1>
            <p className="text-bolt-elements-textSecondary">
              Demonstrating the <HandwrittenAccent>Indie Flower</HandwrittenAccent> handwritten font integration
            </p>
          </div>

          {/* Welcome Message Component */}
          <section className="bg-bolt-elements-background-depth-2 rounded-lg">
            <h2 className="text-2xl font-semibold text-bolt-elements-textPrimary p-6 pb-0">
              Welcome Message Component
            </h2>
            <WelcomeMessage />
          </section>

          {/* Compact Welcome */}
          <section className="bg-bolt-elements-background-depth-2 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-bolt-elements-textPrimary mb-4">
              Compact Welcome Variant
            </h2>
            <CompactWelcome />
          </section>

          {/* Typography Utilities */}
          <section className="bg-bolt-elements-background-depth-2 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-bolt-elements-textPrimary mb-6">
              Typography Utilities
            </h2>
            <div className="space-y-6">
              
              <div>
                <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">Handwritten Headings</h3>
                <div className="space-y-2">
                  <h1 className="title-handwritten text-accent-500">Large Title (title-handwritten)</h1>
                  <h2 className="heading-handwritten text-accent-500">Medium Heading (heading-handwritten)</h2>
                  <h3 className="subtitle-handwritten text-accent-500">Subtitle (subtitle-handwritten)</h3>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">Handwritten Text</h3>
                <p className="text-handwritten text-bolt-elements-textSecondary">
                  This is regular handwritten text using the text-handwritten utility class.
                </p>
                <p className="label-handwritten text-bolt-elements-textTertiary">
                  This is smaller label text (label-handwritten).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">Decorative Text</h3>
                <div className="space-y-3">
                  <p className="decorative-text text-accent-500">
                    Decorative text with slight rotation
                  </p>
                  <div className="flex gap-3">
                    <span className="label-handwritten bg-accent-50 text-accent-700 px-3 py-1 rounded-full transform -rotate-1">
                      Rotated left
                    </span>
                    <span className="label-handwritten bg-green-50 text-green-700 px-3 py-1 rounded-full transform rotate-1">
                      Rotated right
                    </span>
                    <span className="label-handwritten bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                      No rotation
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">Colored Accents</h3>
                <div className="space-y-2">
                  <p>
                    This is regular text with <HandwrittenAccent color="accent">accent colored</HandwrittenAccent> handwritten words.
                  </p>
                  <p>
                    You can also use <HandwrittenAccent color="green">green</HandwrittenAccent>, 
                    <HandwrittenAccent color="blue"> blue</HandwrittenAccent>, or 
                    <HandwrittenAccent color="purple"> purple</HandwrittenAccent> colors.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* Usage Examples */}
          <section className="bg-bolt-elements-background-depth-2 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-bolt-elements-textPrimary mb-6">
              Creative Usage Examples
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Example 1: Personal Note */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <div className="decorative-text text-yellow-800 text-lg mb-2">
                  Quick Note ✏️
                </div>
                <p className="text-handwritten text-yellow-700 leading-relaxed">
                  Remember to add error handling to the API endpoints before deployment!
                </p>
              </div>

              {/* Example 2: Feature Highlight */}
              <div className="bg-gradient-to-br from-accent-50 to-purple-50 p-4 rounded-lg relative">
                <div className="title-handwritten text-accent-600 mb-2">
                  New Feature! 🎉
                </div>
                <p className="text-handwritten text-gray-700">
                  Real-time collaboration is now available for all projects
                </p>
                <div className="absolute -top-1 -right-1 decorative-text text-accent-400 text-xl">
                  ✨
                </div>
              </div>

              {/* Example 3: Quote */}
              <div className="md:col-span-2 bg-gray-50 p-6 rounded-lg border-l-4 border-gray-300">
                <blockquote className="decorative-text text-gray-600 text-xl text-center italic">
                  "Code is poetry written in logic"
                </blockquote>
                <div className="text-handwritten text-gray-500 text-right mt-2">
                  - Anonymous Developer
                </div>
              </div>

            </div>
          </section>

          {/* Implementation Guide */}
          <section className="bg-bolt-elements-background-depth-2 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-bolt-elements-textPrimary mb-6">
              Implementation Guide
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">Available CSS Classes</h3>
                <div className="bg-bolt-elements-background-depth-1 p-4 rounded-lg font-mono text-sm">
                  <div className="grid md:grid-cols-2 gap-2 text-bolt-elements-textSecondary">
                    <div>.text-handwritten</div>
                    <div>.text-indie</div>
                    <div>.heading-handwritten</div>
                    <div>.title-handwritten</div>
                    <div>.subtitle-handwritten</div>
                    <div>.label-handwritten</div>
                    <div>.decorative-text</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">Font Stack</h3>
                <div className="bg-bolt-elements-background-depth-1 p-4 rounded-lg">
                  <code className="text-bolt-elements-textSecondary">
                    font-family: "Indie Flower", cursive;
                  </code>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">Best Practices</h3>
                <ul className="list-disc list-inside space-y-2 text-bolt-elements-textSecondary">
                  <li>Use handwritten fonts sparingly for emphasis and personality</li>
                  <li>Combine with subtle rotations for a more natural handwritten feel</li>
                  <li>Ensure sufficient contrast for accessibility</li>
                  <li>Consider using decorative elements like emojis and symbols</li>
                  <li>Test readability across different screen sizes</li>
                </ul>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
