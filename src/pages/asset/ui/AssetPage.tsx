import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import StarsIcon from "@mui/icons-material/Stars";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { PieChart } from "@mui/x-charts";
import { useAccountBookContext } from "../../../entities/accountbook/model/AccountBookContext";
import { useMembers } from "../../../entities/accountbook/model/useMembers";
import { useAssets } from "../../../entities/asset/model/useAssets";
import { getUserSeq } from "../../../shared/lib/userSync";
import {
  ASSET_TYPE_CONFIG,
  ASSET_TYPES,
  type AssetResponse,
  type AssetType,
} from "../../../entities/asset/api/asset.types";
import type { MemberResponse } from "../../../entities/accountbook/api/member.types";
import AssetCreateModal from "../../../features/asset/ui/AssetCreateModal";
import AssetBalanceModal from "../../../features/asset/ui/AssetBalanceModal";
import AssetHistoryModal from "../../../features/asset/ui/AssetHistoryModal";

/** 멤버 인덱스 기반 결정적 색상 */
const MEMBER_COLORS = [
  "#5c6bc0", "#26a69a", "#ef5350",
  "#ab47bc", "#42a5f5", "#ff7043", "#66bb6a", "#ffa726",
];
const memberColor = (idx: number) => MEMBER_COLORS[idx % MEMBER_COLORS.length];

/** 자산 유형별 아이콘 */
function AssetIcon({ type, size = 24 }: { type: AssetType; size?: number }) {
  const sx = { fontSize: size };
  switch (type) {
    case "BANK":       return <AccountBalanceIcon sx={sx} />;
    case "CARD":       return <CreditCardIcon sx={sx} />;
    case "CASH":       return <LocalAtmIcon sx={sx} />;
    case "INVESTMENT": return <TrendingUpIcon sx={sx} />;
    case "POINT":      return <StarsIcon sx={sx} />;
  }
}

/** 금액 축약 포맷 */
function fmt(value: number) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(1)}억원`;
  if (abs >= 10_000)      return `${sign}${(abs / 10_000).toFixed(abs % 10_000 === 0 ? 0 : 1)}만원`;
  return `${sign}${abs.toLocaleString("ko-KR")}원`;
}

interface AssetCardProps {
  asset: AssetResponse;
  isOwn: boolean;
  onRecord: (asset: AssetResponse) => void;
  onHistory: (asset: AssetResponse) => void;
  onDelete: (seq: number) => void;
}

function AssetCard({ asset, isOwn, onRecord, onHistory, onDelete }: AssetCardProps) {
  const theme = useTheme();
  const cfg = ASSET_TYPE_CONFIG[asset.type];
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.07)}` },
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.5} mb={2}>
          <Avatar sx={{ bgcolor: alpha(cfg.color, 0.14), color: cfg.color, width: 44, height: 44 }}>
            <AssetIcon type={asset.type} size={22} />
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1" fontWeight={700}
              sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {asset.name}
            </Typography>
            <Chip size="small" label={cfg.label} sx={{
              fontSize: "0.65rem", height: 18,
              bgcolor: alpha(cfg.color, 0.1), color: cfg.color, fontWeight: 700,
            }} />
          </Box>

          {isOwn && (
            <>
              <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
              <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
                <MenuItem onClick={() => { setMenuAnchor(null); onHistory(asset); }}>잔액 내역 보기</MenuItem>
                <MenuItem
                  onClick={() => { setMenuAnchor(null); onDelete(asset.seq); }}
                  sx={{ color: "error.main" }}
                >
                  자산 삭제
                </MenuItem>
              </Menu>
            </>
          )}
          {!isOwn && (
            <IconButton size="small" onClick={() => onHistory(asset)}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>

        <Typography variant="h5" fontWeight={800} sx={{ color: cfg.color, mb: 0.5 }}>
          {asset.balance.toLocaleString("ko-KR")}원
        </Typography>
        {asset.note && (
          <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
            {asset.note}
          </Typography>
        )}

        <Stack direction="row" spacing={1} mt={1.5}>
          {isOwn && (
            <Button fullWidth size="small" variant="contained" onClick={() => onRecord(asset)}
              sx={{ fontWeight: 700, borderRadius: 2, fontSize: "0.78rem",
                bgcolor: cfg.color, "&:hover": { bgcolor: alpha(cfg.color, 0.85) } }}>
              잔액 기록
            </Button>
          )}
          <Button fullWidth size="small" variant="outlined" onClick={() => onHistory(asset)}
            sx={{ fontWeight: 700, borderRadius: 2, fontSize: "0.78rem",
              borderColor: alpha(cfg.color, 0.5), color: cfg.color,
              "&:hover": { borderColor: cfg.color, bgcolor: alpha(cfg.color, 0.06) } }}>
            내역
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

/** 멤버 섹션 헤더 */
function MemberSectionHeader({
  member,
  color,
  totalBalance,
  assetCount,
}: {
  member: MemberResponse | null;
  color: string;
  totalBalance: number;
  assetCount: number;
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={2} mb={2}>
      <Avatar
        src={member?.imageUrl}
        sx={{ bgcolor: color, width: 40, height: 40, fontWeight: 700 }}
      >
        {!member?.imageUrl && (member?.name?.charAt(0).toUpperCase() ?? "?")}
      </Avatar>
      <Box sx={{ flexGrow: 1 }}>
        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography variant="subtitle1" fontWeight={800}>
            {member?.name ?? "알 수 없음"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {member?.email}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" fontWeight={700} sx={{ color }}>
            {fmt(totalBalance)}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            ({assetCount}개 자산)
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}

type PieMode = "type" | "member";

function AssetPage() {
  const theme = useTheme();
  const { currentAccountBook } = useAccountBookContext();
  const accountBookId = currentAccountBook?.id ?? null;

  const { assets, loading, error, createAsset, deleteAsset, recordBalance, refresh } =
    useAssets(accountBookId);
  const { members, loading: membersLoading } = useMembers(accountBookId);

  const [myUserSeq, setMyUserSeq] = useState<number | null>(null);
  useEffect(() => {
    getUserSeq().then(setMyUserSeq).catch(() => {});
  }, []);

  const [createOpen, setCreateOpen] = useState(false);
  const [recordTarget, setRecordTarget] = useState<AssetResponse | null>(null);
  const [historyTarget, setHistoryTarget] = useState<AssetResponse | null>(null);
  const [pieMode, setPieMode] = useState<PieMode>("member");

  /** 멤버 맵 (userId → MemberResponse) */
  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.userId, m])),
    [members],
  );

  /** 멤버별 자산 그룹: [{ member, assets, total, color }] */
  const memberGroups = useMemo(() => {
    // assets에서 나타나는 userSeq 수집 (멤버에 없는 탈퇴 유저 포함)
    const seqSet = new Set(assets.map((a) => a.userSeq));

    // 멤버 순서 우선, 탈퇴 유저는 뒤에
    const orderedSeqs = [
      ...members.map((m) => m.userId).filter((id) => seqSet.has(id)),
      ...[...seqSet].filter((id) => !members.some((m) => m.userId === id)),
    ];

    return orderedSeqs.map((userId, idx) => ({
      userId,
      member: memberMap.get(userId) ?? null,
      assets: assets.filter((a) => a.userSeq === userId),
      total: assets.filter((a) => a.userSeq === userId).reduce((s, a) => s + a.balance, 0),
      color: memberColor(idx),
    }));
  }, [assets, members, memberMap]);

  /** 전체 합계 */
  const totalBalance = useMemo(
    () => assets.reduce((s, a) => s + a.balance, 0),
    [assets],
  );

  /** 파이 데이터: 유형별 */
  const pieByType = useMemo(() => {
    const map: Partial<Record<AssetType, number>> = {};
    assets.forEach((a) => { map[a.type] = (map[a.type] ?? 0) + a.balance; });
    return ASSET_TYPES
      .filter((t) => (map[t] ?? 0) !== 0)
      .map((t, i) => ({
        id: i, value: map[t]!,
        label: ASSET_TYPE_CONFIG[t].label,
        color: ASSET_TYPE_CONFIG[t].color,
      }));
  }, [assets]);

  /** 파이 데이터: 멤버별 */
  const pieByMember = useMemo(
    () => memberGroups
      .filter((g) => g.total !== 0)
      .map((g, i) => ({
        id: i, value: g.total,
        label: g.member?.name ?? `사용자 ${g.userId}`,
        color: g.color,
      })),
    [memberGroups],
  );

  const pieData = pieMode === "member" ? pieByMember : pieByType;

  const handleDelete = async (seq: number) => {
    if (!window.confirm("이 자산을 삭제하시겠습니까?")) return;
    try { await deleteAsset(seq); }
    catch (e) { alert(e instanceof Error ? e.message : "삭제 실패"); }
  };

  const isLoading = loading || membersLoading;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* 페이지 헤더 */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{
            width: 40, height: 40, borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AccountBalanceWalletOutlinedIcon sx={{ color: "primary.main", fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} lineHeight={1.3}>자산 관리</Typography>
            <Typography variant="body2" color="text.secondary">멤버별 통장·카드·현금·투자 잔액 추적</Typography>
          </Box>
        </Stack>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}
          sx={{ fontWeight: 700, borderRadius: 2 }}>
          내 자산 추가
        </Button>
      </Stack>

      {/* 로딩 */}
      {isLoading && (
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }} gap={3}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={200} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      )}

      {/* 에러 */}
      {!isLoading && error && (
        <Box sx={{ py: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
          <ErrorOutlineIcon color="error" sx={{ fontSize: 40 }} />
          <Typography color="error" fontWeight={600}>{error}</Typography>
          <Button onClick={() => void refresh()}>다시 시도</Button>
        </Box>
      )}

      {/* 빈 상태 */}
      {!isLoading && !error && assets.length === 0 && (
        <Box sx={{ py: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
          <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 56, color: "text.disabled" }} />
          <Typography variant="h6" color="text.secondary" fontWeight={700}>아직 자산이 없습니다.</Typography>
          <Typography variant="body2" color="text.disabled" mb={2}>
            은행 통장, 카드, 현금 등을 추가해 보세요.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            첫 번째 자산 추가
          </Button>
        </Box>
      )}

      {!isLoading && !error && assets.length > 0 && (
        <Stack spacing={4}>
          {/* 총 자산 요약 + 파이 차트 */}
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }} gap={3}>

            {/* 총 자산 요약 */}
            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600} mb={0.5}>
                  가계부 총 자산
                </Typography>
                <Typography variant="h4" fontWeight={900} color="primary.main" mb={2.5}>
                  {totalBalance.toLocaleString("ko-KR")}원
                </Typography>

                {/* 멤버별 합계 */}
                <Stack spacing={1.2}>
                  {memberGroups.map((g) => (
                    <Stack key={g.userId} direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: g.color }} />
                        <Typography variant="body2" color="text.secondary">
                          {g.member?.name ?? `사용자 ${g.userId}`}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">({g.assets.length})</Typography>
                      </Stack>
                      <Typography variant="body2" fontWeight={700}>{fmt(g.total)}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* 파이 차트 */}
            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    자산 구성
                  </Typography>
                  <ToggleButtonGroup
                    exclusive size="small" value={pieMode}
                    onChange={(_, v) => { if (v) setPieMode(v as PieMode); }}
                  >
                    <ToggleButton value="member" sx={{ px: 1.2, fontSize: "0.72rem" }}>멤버별</ToggleButton>
                    <ToggleButton value="type"   sx={{ px: 1.2, fontSize: "0.72rem" }}>유형별</ToggleButton>
                  </ToggleButtonGroup>
                </Stack>
                {pieData.length === 0 ? (
                  <Box sx={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography variant="body2" color="text.disabled">잔액이 0인 자산만 있습니다.</Typography>
                  </Box>
                ) : (
                  <PieChart
                    series={[{
                      data: pieData,
                      innerRadius: 50, outerRadius: 90,
                      paddingAngle: 3, cornerRadius: 4,
                      valueFormatter: (item) => `${item.value.toLocaleString("ko-KR")}원`,
                    }]}
                    height={220}
                    margin={{ left: 0, right: 120, top: 8, bottom: 8 }}
                    slotProps={{ legend: { position: { vertical: "middle", horizontal: "right" } } }}
                  />
                )}
              </CardContent>
            </Card>
          </Box>

          {/* 멤버별 자산 섹션 */}
          {memberGroups.map((group, idx) => (
            <Box key={group.userId}>
              {idx > 0 && <Divider sx={{ mb: 3 }} />}

              <MemberSectionHeader
                member={group.member}
                color={group.color}
                totalBalance={group.total}
                assetCount={group.assets.length}
              />

              {group.assets.length === 0 ? (
                <Box sx={{
                  py: 3, px: 2, borderRadius: 2,
                  bgcolor: alpha(theme.palette.action.hover, 0.5),
                  textAlign: "center",
                }}>
                  <Typography variant="body2" color="text.secondary">
                    이 멤버의 자산이 없습니다.
                  </Typography>
                </Box>
              ) : (
                <Box
                  display="grid"
                  gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }}
                  gap={2}
                >
                  {group.assets.map((asset) => (
                    <AssetCard
                      key={asset.seq}
                      asset={asset}
                      isOwn={asset.userSeq === myUserSeq}
                      onRecord={setRecordTarget}
                      onHistory={setHistoryTarget}
                      onDelete={(seq) => void handleDelete(seq)}
                    />
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      )}

      {/* 모달 */}
      <AssetCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (req) => { await createAsset(req); }}
      />
      <AssetBalanceModal
        open={Boolean(recordTarget)}
        asset={recordTarget}
        onClose={() => setRecordTarget(null)}
        onSubmit={async (seq, balance, note) => {
          await recordBalance(seq, balance, note);
          setRecordTarget(null);
        }}
      />
      <AssetHistoryModal
        open={Boolean(historyTarget)}
        asset={historyTarget}
        onClose={() => setHistoryTarget(null)}
      />
    </Container>
  );
}

export default AssetPage;
