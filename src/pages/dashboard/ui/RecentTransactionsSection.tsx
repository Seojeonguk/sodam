import { Avatar, Box, Divider, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { ArrowDownward, ArrowUpward, CompareArrows } from "@mui/icons-material";
import dayjs from "dayjs";
import type { TransactionListItemResponse } from "../../../entities/transaction/api/transaction.types";
import { formatCurrency } from "../../../shared/lib/format";
import { TYPE_MUI_COLOR, TYPE_SIGN } from "../../../entities/category/lib/classificationUtils";

interface RecentTransactionsSectionProps {
  transactions: TransactionListItemResponse[];
}

export const RecentTransactionsSection = ({
  transactions,
}: RecentTransactionsSectionProps) => {
  const theme = useTheme();
  const hasTransactions = transactions.length > 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="h6" fontWeight={600} mb={1}>
        최근 거래 5건
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        최신 데이터 기반으로 가장 최근에 기록된 거래입니다.
      </Typography>
      {!hasTransactions ? (
        <Typography sx={{ width: "100%", height: 320, display: "flex", alignItems: "center", justifyContent: "center" }} color="text.secondary">
          아직 거래 데이터가 없습니다.
        </Typography>
      ) : (
        <Stack divider={<Divider flexItem />} spacing={2}>
          {transactions.map((tx) => {
            const muiColor = TYPE_MUI_COLOR[tx.type] ?? "default";
            const palKey = muiColor !== "default" ? muiColor : "primary";
            const sign = TYPE_SIGN(tx.type);
            return (
            <Stack key={tx.seq} direction="row" alignItems="center" spacing={2}>
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette[palKey as "success" | "error" | "info" | "primary"].main, 0.15),
                  color: theme.palette[palKey as "success" | "error" | "info" | "primary"].dark,
                }}
              >
                {tx.type === "INCOME" ? <ArrowUpward /> : tx.type === "EXPENSE" ? <ArrowDownward /> : <CompareArrows />}
              </Avatar>
              <Box flex={1}>
                <Typography fontWeight={600} color={`${palKey}.dark`}>
                  {sign}{formatCurrency(tx.amount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {tx.categoryName ?? "분류 없음"} ·{" "}
                  {dayjs(tx.transactionDate).format("YY.MM.DD HH:mm")}
                </Typography>
                {tx.description && (
                  <Typography variant="caption" color="text.secondary">
                    {tx.description}
                  </Typography>
                )}
              </Box>
            </Stack>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
};
