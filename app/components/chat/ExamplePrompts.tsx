import React from 'react';

const EXAMPLE_PROMPTS = [
  { text: 'Buat Website Rental Mobil' },
  { text: 'Buat Website Company Profile' },
  { text: 'Buat Landing Page' },
  { text: 'Buat Undangan Online' },
  { text: 'Buat Kartu Ucapan' },
];

const PROMPT = [
  `Develop a car rental website using ViteJS with the following specifications:
1.  **Car Listings:** Display a list of cars including "Ayla", "Agya", "Avanza", "Xenia", "Sigra", and "Calya". Each listing must include a car image and a "Book Now" button.
2.  **WhatsApp Integration:** The "Book Now" button should initiate a WhatsApp chat with the number +628773800011, using a pre-filled message: "Pesan mobil [car name]", where [car name] is the specific car's name.
3.  **Visual Theme:** Implement a blue color theme, similar to the visual style of Traveloka.
4.  **Homepage Slider:** The homepage must feature a slider with the title "Website Rental Mobil Terbaik" and the tagline "Pesan mobil rental hanya disini, tinggal klik pesan".
5.  **Navigation:** Include the following pages, accessible via navigation links: "Contact Us", "About Us", and "Car List" (a duplicate of the car list on the homepage).
6.  **Responsive Layout:** Ensure the website is fully responsive across various screen sizes and devices.
7.  **Project Setup:** Use ViteJS for project setup and development.
`,
`buatkan website company profile seperti gojek`,
`buatkan landing page`,
`buatkan undangan online islami jawa`,
`buatkan kartu ucapan`
];

export function ExamplePrompts(sendMessage?: { (event: React.UIEvent, messageInput?: string): void | undefined }) {
  return (
    <div id="examples" className="relative flex flex-col gap-9 w-full max-w-3xl mx-auto flex justify-center mt-6">
      <div
        className="flex flex-wrap justify-center gap-2"
        style={{
          animation: '.25s ease-out 0s 1 _fade-and-move-in_g2ptj_1 forwards',
        }}
      >
        {EXAMPLE_PROMPTS.map((examplePrompt, index: number) => {
          return (
            <button
              key={index}
              onClick={(event) => {
                sendMessage?.(event, PROMPT[index]);
              }}
              className="border border-bolt-elements-borderColor rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-900 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary px-3 py-1 text-xs transition-theme"
            >
              {examplePrompt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
