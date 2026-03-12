import { Paper, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts";
import { useTheme } from "@mui/material/styles";

interface MonthlyTrendSectionProps {
  dataset: Record<string, number | string>[];
}

export const MonthlyTrendSection = ({ dataset }: MonthlyTrendSectionProps) => {
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
        월별 수입 / 지출 추이
      </Typography>
      {dataset.length === 0 ? (
        <Typography sx={{ width: "100%", height: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
          수입 및 지출 내역이 없습니다.
        </Typography>
      ) : (
        <BarChart
          dataset={dataset}
          xAxis={[
            {
              dataKey: "period",
              scaleType: "band",
              label: "기간",
              height: 50,
            },
          ]}
          series={[
            {
              dataKey: "income",
              label: "수입",
              color: theme.palette.success.main,
            },
            {
              dataKey: "expense",
              label: "지출",
              color: theme.palette.error.main,
            },
          ]}
          height={320}
          grid={{ horizontal: true }}
        />
      )}
    </Paper>
  );
};
