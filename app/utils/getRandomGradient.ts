export const getRandomGradient = () => {
  const colors = [
    'rgba(255, 0, 0, 1)', // Red
    'rgba(0, 255, 0, 1)', // Green
    'rgba(0, 0, 255, 1)', // Blue
    'rgba(255, 165, 0, 1)', // Orange
    'rgba(128, 0, 128, 1)', // Purple
  ];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  return `linear-gradient(135deg, ${randomColor}, transparent)`;
};
