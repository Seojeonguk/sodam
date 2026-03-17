import { Avatar, Box, Paper, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";

interface SummaryCardConfig {
  title: string;
  subtitle: string;
  value: string;
  icon: ReactNode;
  accent: string;
}

interface SummaryCardsProps {
  cards: SummaryCardConfig[];
}

export const SummaryCards = ({ cards }: SummaryCardsProps) => (
  <Box
    display="grid"
    gridTemplateColumns={{ xs: "1fr", md: "repeat(3, 1fr)" }}
    gap={3}
  >
    {cards.map((card) => (
      <SummaryCard key={card.title} {...card} />
    ))}
  </Box>
);

const SummaryCard = ({
  title,
  subtitle,
  value,
  icon,
  accent,
}: SummaryCardConfig) => {
  const theme = useTheme();
  const surfaceColor = alpha(accent, 0.04);
  const borderColor = alpha(accent, 0.3);
  const avatarBg = alpha(accent, 0.2);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: `1px solid ${borderColor}`,
        backgroundColor: surfaceColor || theme.palette.background.paper,
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Avatar
        sx={{
          bgcolor: avatarBg,
          color: accent,
          width: 48,
          height: 48,
        }}
      >
        {icon}
      </Avatar>
      <Box>
        <Typography variant="overline" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h6" fontWeight={700}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
    </Paper>
  );
};
