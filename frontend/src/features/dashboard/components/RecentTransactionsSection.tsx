import { Avatar, Box, Divider, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { ArrowDownward, ArrowUpward } from "@mui/icons-material";
import dayjs from "dayjs";
import type { TransactionListItemResponse } from "../../transaction/services/transaction.types";
import { formatCurrency } from "../utils/format";

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
          {transactions.map((tx) => (
            <Stack key={tx.seq} direction="row" alignItems="center" spacing={2}>
              <Avatar
                sx={{
                  bgcolor:
                    tx.type === "INCOME"
                      ? alpha(theme.palette.success.main, 0.15)
                      : alpha(theme.palette.error.main, 0.15),
                  color:
                    tx.type === "INCOME"
                      ? theme.palette.success.dark
                      : theme.palette.error.dark,
                }}
              >
                {tx.type === "INCOME" ? <ArrowUpward /> : <ArrowDownward />}
              </Avatar>
              <Box flex={1}>
                <Typography fontWeight={600}>
                  {formatCurrency(tx.amount)}
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
          ))}
        </Stack>
      )}
    </Paper>
  );
};
