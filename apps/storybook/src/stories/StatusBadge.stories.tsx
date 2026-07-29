import { StatusBadge } from "@credit-decision-hub/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Components/StatusBadge",
  component: StatusBadge,
  args: {
    children: "Pendente",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Indicador visual genérico. O domínio consumidor define o texto e o tom semântico.",
      },
    },
  },
} satisfies Meta<typeof StatusBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

export const Success: Story = {
  args: {
    children: "Aprovada",
    tone: "success",
  },
};

export const Warning: Story = {
  args: {
    children: "Análise manual",
    tone: "warning",
  },
};

export const Danger: Story = {
  args: {
    children: "Reprovada",
    tone: "danger",
  },
};
