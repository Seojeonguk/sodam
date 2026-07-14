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

  // 0값 슬라이스는 PieChart 렌더링 오류를 유발하므로 제외
  const pieData = [
    totalIncome > 0
      ? { id: 0, value: totalIncome, label: "수입", color: theme.palette.success.main }
      : null,
    totalExpense > 0
      ? { id: 1, value: totalExpense, label: "지출", color: theme.palette.error.main }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  const isEmpty = pieData.length === 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
      <Typography variant="h6" fontWeight={600} mb={2}>
        유형별 비중
      </Typography>
      {isEmpty ? (
        <Typography
          sx={{
            width: "100%",
            height: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          color="text.secondary"
        >
          수입 및 지출 내역이 없습니다.
        </Typography>
      ) : (
        <PieChart
          height={300}
          series={[
            {
              innerRadius: 50,
              outerRadius: 110,
              paddingAngle: pieData.length > 1 ? 3 : 0,
              cornerRadius: 4,
              data: pieData,
              highlightScope: { fade: "global", highlight: "item" },
            },
          ]}
          slotProps={{
            legend: {
              direction: "column",
              position: { vertical: "middle", horizontal: "right" },
              padding: 0,
              itemMarkWidth: 12,
              itemMarkHeight: 12,
              markGap: 6,
              itemGap: 10,
            },
          }}
        />
      )}
    </Paper>
  );
};
