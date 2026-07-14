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
    /* 모바일: 1열 (가로 전체 사용) / sm 이상: 3열 */
    gridTemplateColumns={{ xs: "1fr", sm: "repeat(3, 1fr)" }}
    gap={{ xs: 1.5, sm: 2, md: 3 }}
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
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        border: `1px solid ${borderColor}`,
        backgroundColor: surfaceColor || theme.palette.background.paper,
        /* 항상 가로 배치: 모바일은 1열이므로 카드 너비가 충분 */
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
      }}
    >
      {/* 아이콘 아바타 */}
      <Avatar
        sx={{
          bgcolor: avatarBg,
          color: accent,
          width: { xs: 40, sm: 48 },
          height: { xs: 40, sm: 48 },
          flexShrink: 0,
          "& svg": { fontSize: { xs: "1.2rem", sm: "1.5rem" } },
        }}
      >
        {icon}
      </Avatar>

      {/* 텍스트 */}
      <Box sx={{ minWidth: 0 }}>
        <Typography
          component="div"
          color="text.secondary"
          sx={{
            fontSize: "0.65rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            lineHeight: 1.4,
            mb: 0.25,
          }}
        >
          {title}
        </Typography>

        <Typography
          fontWeight={700}
          sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" }, lineHeight: 1.2 }}
        >
          {value}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 0.25, display: "block" }}
        >
          {subtitle}
        </Typography>
      </Box>
    </Paper>
  );
};
