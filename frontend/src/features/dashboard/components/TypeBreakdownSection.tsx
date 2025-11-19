import { Paper, Typography } from "@mui/material";
import { PieChart } from "@mui/x-charts";
import { useTheme } from "@mui/material/styles";

interface TypeBreakdownSectionProps {
  totalIncome: number;
  totalExpense: number;
}

export const TypeBreakdownSection = ({
  totalIncome,
  totalExpense,
}: TypeBreakdownSectionProps) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        paddingLeft: 0,
        paddingRight: 0,
      }}
    >
      <Typography variant="h6" fontWeight={600} mb={2} sx={{ paddingLeft: 3 }}>
        유형별 비중
      </Typography>
      <PieChart
        height={320}
        series={[
          {
            innerRadius: 40,
            outerRadius: 120,
            data: [
              {
                id: 0,
                value: totalIncome,
                label: "수입",
                color: theme.palette.success.main,
              },
              {
                id: 1,
                value: totalExpense,
                label: "지출",
                color: theme.palette.error.main,
              },
            ],
          },
        ]}
        slotProps={{
          legend: {
            position: { vertical: "middle" },
          },
        }}
      />
    </Paper>
  );
};
