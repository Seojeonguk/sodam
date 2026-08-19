import { useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BarChart } from "@mui/x-charts";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import dayjs from "dayjs";
import { useAccountBookContext } from "../../../entities/accountbook/model/AccountBookContext";
import { useMemberStats } from "../../../entities/transaction/model/useMemberStats";
import { useClassifications } from "../../../entities/category/model/useClassifications";
import {
  TYPE_LABEL,
  TYPE_MUI_COLOR,
  TYPE_SIGN,
} from "../../../entities/category/lib/classificationUtils";
import type { MemberStatData } from "../../../entities/transaction/api/memberStatApi";

/** 금액 축약 포맷 (1,234,000 → 123.4만) */
function formatAmount(value: number): string {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}억`;
  if (value >= 10_000) return `${(value / 10_000).toFixed(1)}만`;
  return value.toLocaleString("ko-KR");
}

/** 멤버 이름에서 아바타 이니셜 추출 */
function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

/** 이름 기반 결정적 색상 */
function nameToColor(name: string): string {
  const colors = [
    "#5c6bc0",
    "#26a69a",
    "#ef5350",
    "#ab47bc",
    "#42a5f5",
    "#ff7043",
    "#66bb6a",
    "#ffa726",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface MemberCardProps {
  member: MemberStatData;
  seriesConfig: { dataKey: string; label: string; color?: string }[];
}

function MemberCard({ member, seriesConfig }: MemberCardProps) {
  const theme = useTheme();
  const avatarColor = nameToColor(member.userName);

  // 이 멤버에 실제 데이터가 있는 달이 하나라도 있는지
  const hasData = member.dataset.some((d) =>
    seriesConfig.some((s) => (d[s.dataKey] as number) > 0),
  );

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        {/* 멤버 헤더 */}
        <Stack direction="row" spacing={1.5} alignItems="center" mb={2.5}>
          <Avatar
            src={member.imageUrl}
            sx={{
              bgcolor: avatarColor,
              width: 44,
              height: 44,
              fontWeight: 700,
              fontSize: "1.1rem",
            }}
          >
            {!member.imageUrl && getInitial(member.userName)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ lineHeight: 1.3 }}
            >
              {member.userName}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {member.userEmail}
            </Typography>
          </Box>
        </Stack>

        {/* 연간 합계 칩 */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={2}>
          {seriesConfig.map((s) => {
            const total = member.yearTotals[s.dataKey] ?? 0;
            const typeUpper = s.dataKey.toUpperCase();
            const muiColor = TYPE_MUI_COLOR[typeUpper] ?? "default";
            const sign = TYPE_SIGN(typeUpper);

            if (total === 0) return null;

            const chipColor =
              muiColor !== "default"
                ? (theme.palette[
                    muiColor as "success" | "error" | "info"
                  ].main)
                : theme.palette.primary.main;

            return (
              <Chip
                key={s.dataKey}
                size="small"
                label={`${TYPE_LABEL[typeUpper] ?? s.label} ${sign}${formatAmount(total)}원`}
                sx={{
                  fontWeight: 700,
                  bgcolor: alpha(chipColor, 0.12),
                  color: chipColor,
                  border: `1px solid ${alpha(chipColor, 0.25)}`,
                }}
              />
            );
          })}
          {seriesConfig.length > 0 && (
            (() => {
              const income = member.yearTotals["income"] ?? 0;
              const expense = member.yearTotals["expense"] ?? 0;
              const balance = income - expense;
              if (income === 0 && expense === 0) return null;
              const balanceColor =
                balance >= 0
                  ? theme.palette.success.main
                  : theme.palette.error.main;
              return (
                <Chip
                  key="balance"
                  size="small"
                  label={`잔액 ${balance >= 0 ? "+" : ""}${formatAmount(balance)}원`}
                  sx={{
                    fontWeight: 700,
                    bgcolor: alpha(balanceColor, 0.1),
                    color: balanceColor,
                    border: `1px solid ${alpha(balanceColor, 0.22)}`,
                  }}
                />
              );
            })()
          )}
        </Stack>

        {/* 월별 바 차트 */}
        {!hasData ? (
          <Box
            sx={{
              height: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(theme.palette.action.hover, 0.5),
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              이 해에 거래 내역이 없습니다.
            </Typography>
          </Box>
        ) : (
          <BarChart
            dataset={member.dataset}
            xAxis={[{ dataKey: "period", scaleType: "band", height: 28 }]}
            series={seriesConfig}
            height={220}
            grid={{ horizontal: true }}
            margin={{ left: 40, right: 8, top: 12, bottom: 32 }}
          />
        )}
      </CardContent>
    </Card>
  );
}

function MemberStatsPage() {
  const now = dayjs();
  const [selectedYear, setSelectedYear] = useState(now.year());
  const { currentAccountBook } = useAccountBookContext();
  const accountBookId = currentAccountBook?.id ?? null;
  const theme = useTheme();

  const { members, loading, error } = useMemberStats(accountBookId, selectedYear);
  const { classifications } = useClassifications();

  const yearOptions = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => now.year() - 4 + i),
    [now],
  );

  /** 차트 시리즈 설정 (분류 기반, 동적) */
  const seriesConfig = useMemo(() => {
    const source =
      classifications.length > 0
        ? classifications
        : [{ name: "INCOME" }, { name: "EXPENSE" }];
    return source.map((cls) => {
      const muiColor = TYPE_MUI_COLOR[cls.name] ?? "default";
      const color =
        muiColor !== "default"
          ? theme.palette[muiColor as "success" | "error" | "info"].main
          : undefined;
      return {
        dataKey: cls.name.toLowerCase(),
        label: TYPE_LABEL[cls.name] ?? cls.name,
        ...(color ? { color } : {}),
      };
    });
  }, [classifications, theme]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* 페이지 헤더 */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PeopleAltOutlinedIcon
            sx={{ color: theme.palette.primary.main, fontSize: 22 }}
          />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800} lineHeight={1.3}>
            멤버별 통계
          </Typography>
          <Typography variant="body2" color="text.secondary">
            가계부 멤버 각자의 월별 수입·지출 현황
          </Typography>
        </Box>
      </Stack>

      {/* 연도 선택 */}
      <Stack direction="row" alignItems="center" spacing={1.5} mt={3} mb={3}>
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          기준 연도
        </Typography>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {yearOptions.map((y) => (
              <MenuItem key={y} value={y}>
                {y}년
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* 로딩 */}
      {loading && (
        <Box
          display="grid"
          gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
          gap={3}
        >
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={380}
              sx={{ borderRadius: 3 }}
            />
          ))}
        </Box>
      )}

      {/* 에러 */}
      {!loading && error && (
        <Box
          sx={{
            py: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <ErrorOutlineIcon color="error" sx={{ fontSize: 40 }} />
          <Typography color="error" fontWeight={600}>
            {error}
          </Typography>
        </Box>
      )}

      {/* 데이터 없음 */}
      {!loading && !error && members.length === 0 && (
        <Box
          sx={{
            py: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <PeopleAltOutlinedIcon
            sx={{ fontSize: 48, color: "text.disabled" }}
          />
          <Typography variant="h6" color="text.secondary" fontWeight={700}>
            {selectedYear}년에 거래 내역이 없습니다.
          </Typography>
          <Typography variant="body2" color="text.disabled">
            거래를 추가하면 멤버별 통계가 여기에 표시됩니다.
          </Typography>
        </Box>
      )}

      {/* 멤버 카드 그리드 */}
      {!loading && !error && members.length > 0 && (
        <>
          {members.length === 1 && (
            <Typography
              variant="body2"
              color="text.secondary"
              mb={2}
              sx={{
                px: 1.5,
                py: 1,
                bgcolor: alpha(theme.palette.info.main, 0.08),
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                display: "inline-block",
              }}
            >
              💡 가계부에 멤버를 초대하면 멤버별 통계를 비교할 수 있습니다.
            </Typography>
          )}
          <Box
            display="grid"
            gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
            gap={3}
            mt={1}
          >
            {members.map((member) => (
              <MemberCard
                key={member.userId}
                member={member}
                seriesConfig={seriesConfig}
              />
            ))}
          </Box>
        </>
      )}
    </Container>
  );
}

export default MemberStatsPage;
