import { Button } from "@credit-decision-hub/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Components/Button",
  component: Button,
  args: {
    children: "Avaliar proposta",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Ação genérica com variantes semânticas e suporte aos atributos nativos de botão.",
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: {
    children: "Cancelar",
    variant: "secondary",
  },
};

export const Danger: Story = {
  args: {
    children: "Excluir",
    variant: "danger",
  },
};

export const Disabled: Story = {
  args: {
    children: "Processando",
    disabled: true,
  },
};

export const FullWidth: Story = {
  args: {
    children: "Tentar novamente",
    fullWidth: true,
  },
};
