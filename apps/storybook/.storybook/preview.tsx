import type { Preview } from "@storybook/react-vite";

import "../src/preview.css";

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme === "dark" ? "dark" : "light";
      document.documentElement.dataset.theme = theme;

      return (
        <div className="min-h-screen bg-canvas p-8 text-body">
          <Story />
        </div>
      );
    },
  ],
  globalTypes: {
    theme: {
      description: "Tema visual dos componentes",
      toolbar: {
        icon: "paintbrush",
        items: [
          { title: "Claro", value: "light" },
          { title: "Escuro", value: "dark" },
        ],
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  parameters: {
    controls: {
      expanded: true,
    },
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default preview;
