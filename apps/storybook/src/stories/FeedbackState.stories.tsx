import { Button, FeedbackState } from "@credit-decision-hub/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Components/FeedbackState",
  component: FeedbackState,
  args: {
    title: "Carregando propostas",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Comunica carregamento, ausência de dados ou falhas de forma acessível.",
      },
    },
  },
} satisfies Meta<typeof FeedbackState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loading: Story = {};

export const Empty: Story = {
  args: {
    title: "Nenhuma proposta encontrada",
    description: "Ajuste os filtros ou cadastre uma nova proposta.",
    action: <Button>Nova proposta</Button>,
  },
};

export const Error: Story = {
  args: {
    title: "Não foi possível carregar",
    description: "Verifique a conexão e tente novamente.",
    action: <Button variant="danger">Tentar novamente</Button>,
    tone: "danger",
  },
};
