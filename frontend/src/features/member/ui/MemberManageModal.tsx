import { useState } from "react";
import {
  alpha,
  useTheme,
} from "@mui/material/styles";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { ContentCopy, DeleteOutline, GroupAdd, PersonOutline } from "@mui/icons-material";
import { useMembers } from "../../../entities/accountbook/model/useMembers";
import type { MemberAuthority } from "../../../entities/accountbook/api/member.types";

const AUTHORITY_LABEL: Record<MemberAuthority, string> = {
  OWNER: "소유자",
  EDITOR: "편집자",
  VIEWER: "뷰어",
};

const AUTHORITY_COLOR: Record<MemberAuthority, "default" | "primary" | "secondary"> = {
  OWNER: "primary",
  EDITOR: "secondary",
  VIEWER: "default",
};

interface Props {
  open: boolean;
  onClose: () => void;
  accountBookId: number;
  accountBookName: string;
}

export default function MemberManageModal({ open, onClose, accountBookId, accountBookName }: Props) {
  const theme = useTheme();
  const { members, loading, error, refresh, invite, updateAuthority, remove } = useMembers(
    open ? accountBookId : null,
  );

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteAuthority, setInviteAuthority] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [pendingInvite, setPendingInvite] = useState<{ token: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const getPendingInviteLink = (token: string, email: string) =>
    `${window.location.origin}/signup?invite=${token}&email=${encodeURIComponent(email)}`;

  const handleCopyLink = () => {
    if (!pendingInvite) return;
    void navigator.clipboard.writeText(getPendingInviteLink(pendingInvite.token, pendingInvite.email));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async () => {
    const email = inviteEmail.trim();
    if (!email) return;
    setInviting(true);
    setInviteError(null);
    try {
      const result = await invite({ email, authority: inviteAuthority });
      setInviteEmail("");
      if (result.status === "pending" && result.inviteToken) {
        setPendingInvite({ token: result.inviteToken, email: result.inviteEmail! });
      }
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : "초대 중 오류가 발생했습니다.");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: number, name: string) => {
    if (!window.confirm(`${name} 님을 멤버에서 삭제하시겠습니까?`)) return;
    try {
      await remove(userId);
    } catch (e) {
      alert(e instanceof Error ? e.message : "삭제 중 오류가 발생했습니다.");
    }
  };

  const handleAuthorityChange = async (userId: number, authority: "EDITOR" | "VIEWER") => {
    try {
      await updateAuthority(userId, { authority });
    } catch (e) {
      alert(e instanceof Error ? e.message : "권한 변경 중 오류가 발생했습니다.");
      void refresh();
    }
  };

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      sx={{
        alignItems: { xs: "flex-end", sm: "center" },
        "& .MuiDialog-paper": {
          m: { xs: 0, sm: 2 },
          width: "100%",
          borderRadius: { xs: "16px 16px 0 0", sm: 3 },
          maxHeight: { xs: "85vh", sm: "80vh" },
        },
      }}
    >
      <DialogTitle sx={{ pb: 0.5, fontWeight: 700 }}>
        멤버 관리
        <Typography variant="body2" color="text.secondary" fontWeight={400}>
          {accountBookName}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>

        {/* 초대 영역 */}
        <Box
          sx={{
            p: 1.5,
            mb: 2,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.06),
            border: "1px solid",
            borderColor: alpha(theme.palette.primary.main, 0.2),
          }}
        >
          <Stack direction="row" alignItems="center" spacing={0.75} mb={1.5}>
            <GroupAdd sx={{ fontSize: "1rem", color: "primary.main" }} />
            <Typography variant="body2" fontWeight={700} color="primary.main">
              멤버 초대
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <TextField
              fullWidth
              size="small"
              label="이메일"
              type="email"
              placeholder="초대할 사람의 이메일"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleInvite(); }}
              sx={{ "& fieldset": { borderRadius: 1.5 } }}
            />
            <Stack direction="row" spacing={1}>
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <InputLabel>권한</InputLabel>
                <Select
                  value={inviteAuthority}
                  label="권한"
                  onChange={(e) => setInviteAuthority(e.target.value as "EDITOR" | "VIEWER")}
                  sx={{ "& fieldset": { borderRadius: 1.5 } }}
                >
                  <MenuItem value="EDITOR">편집자</MenuItem>
                  <MenuItem value="VIEWER">뷰어</MenuItem>
                </Select>
              </FormControl>
              <Button
                fullWidth
                variant="contained"
                size="small"
                disabled={!inviteEmail.trim() || inviting}
                onClick={() => void handleInvite()}
                sx={{ fontWeight: 700, textTransform: "none", borderRadius: 1.5 }}
              >
                {inviting ? <CircularProgress size={16} /> : "초대"}
              </Button>
            </Stack>
            {inviteError && (
              <Typography variant="caption" color="error">{inviteError}</Typography>
            )}
          </Stack>

          {/* 권한 설명 */}
          <Stack direction="row" spacing={1} mt={1.5}>
            {(["EDITOR", "VIEWER"] as const).map((auth) => (
              <Box key={auth} sx={{ flex: 1, p: 1, borderRadius: 1.5, bgcolor: "background.paper" }}>
                <Typography variant="caption" fontWeight={700} display="block">{AUTHORITY_LABEL[auth]}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                  {auth === "EDITOR" ? "거래 추가·수정·삭제" : "읽기 전용"}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* 멤버 목록 */}
        <Typography variant="caption" fontWeight={700} color="text.secondary"
          sx={{ textTransform: "uppercase", letterSpacing: "0.05em", display: "block", mb: 1 }}>
          멤버 ({members.length})
        </Typography>

        {loading && (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={24} />
          </Box>
        )}

        {error && (
          <Typography variant="body2" color="error">{error}</Typography>
        )}

        <Stack spacing={1}>
          {members.map((member) => (
            <Stack
              key={member.userId}
              direction="row"
              alignItems="center"
              spacing={1.25}
              sx={{
                p: 1.25,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              {/* 아바타 */}
              <Avatar
                src={member.imageUrl}
                sx={{ width: 36, height: 36, fontSize: "0.9rem", bgcolor: "primary.main", flexShrink: 0 }}
              >
                {member.name?.[0] ?? <PersonOutline fontSize="small" />}
              </Avatar>

              {/* 이름/이메일 */}
              <Box flex={1} minWidth={0}>
                <Typography variant="body2" fontWeight={700} noWrap>{member.name}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>{member.email}</Typography>
              </Box>

              {/* 권한 */}
              {member.authority === "OWNER" ? (
                <Chip
                  label={AUTHORITY_LABEL[member.authority]}
                  size="small"
                  color={AUTHORITY_COLOR[member.authority]}
                  sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                />
              ) : (
                <Select
                  size="small"
                  value={member.authority}
                  onChange={(e) => void handleAuthorityChange(member.userId, e.target.value as "EDITOR" | "VIEWER")}
                  sx={{
                    fontSize: "0.75rem",
                    "& .MuiSelect-select": { py: 0.4, px: 1 },
                    "& fieldset": { borderRadius: 1.5 },
                  }}
                >
                  <MenuItem value="EDITOR" sx={{ fontSize: "0.8rem" }}>편집자</MenuItem>
                  <MenuItem value="VIEWER" sx={{ fontSize: "0.8rem" }}>뷰어</MenuItem>
                </Select>
              )}

              {/* 삭제 버튼 (OWNER 제외) */}
              {member.authority !== "OWNER" && (
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => void handleRemove(member.userId, member.name)}
                >
                  <DeleteOutline fontSize="small" />
                </IconButton>
              )}
            </Stack>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>

    {/* 미가입자 초대 링크 다이얼로그 */}
    <Dialog
      open={Boolean(pendingInvite)}
      onClose={() => { setPendingInvite(null); setCopied(false); }}
      maxWidth="xs"
      fullWidth
      sx={{ "& .MuiDialog-paper": { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 0.5, fontWeight: 700 }}>초대 링크 공유</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          <b>{pendingInvite?.email}</b>는 아직 가입하지 않은 이메일입니다.
          아래 링크를 공유하면 가입 후 자동으로 멤버로 추가됩니다.
          (링크 유효기간: 7일)
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            p: 1.5,
            borderRadius: 2,
            bgcolor: "action.hover",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              flex: 1,
              wordBreak: "break-all",
              fontFamily: "monospace",
              fontSize: "0.7rem",
              color: "text.secondary",
            }}
          >
            {pendingInvite
              ? getPendingInviteLink(pendingInvite.token, pendingInvite.email)
              : ""}
          </Typography>
          <Tooltip title={copied ? "복사됨!" : "링크 복사"} placement="top">
            <IconButton size="small" onClick={handleCopyLink} color={copied ? "success" : "default"}>
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={handleCopyLink}
          color={copied ? "success" : "primary"}
          sx={{ fontWeight: 700, textTransform: "none", borderRadius: 1.5 }}
        >
          {copied ? "복사됨!" : "링크 복사"}
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => { setPendingInvite(null); setCopied(false); }}
          sx={{ fontWeight: 700, textTransform: "none", borderRadius: 1.5 }}
        >
          닫기
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}
