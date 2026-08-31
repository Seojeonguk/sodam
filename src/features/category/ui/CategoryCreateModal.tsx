import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  ClickAwayListener,
  FormControlLabel,
  Modal,
  Switch,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { ChromePicker } from "react-color";
import axios, { type AxiosError } from "axios";

import categoryApi from "../../../entities/category/api/categoryApi";
import { useClassifications } from "../../../entities/category/model/useClassifications";
import { FALLBACK_CLASSIFICATIONS, TYPE_LABEL, TYPE_SOLID_STYLE } from "../../../entities/category/lib/classificationUtils";

const getRandomColor = () =>
  `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0")}`;

const style = {
  position: "fixed",
  // 모바일: 하단 고정, 데스크톱: 중앙
  bottom: { xs: 0, sm: "50%" },
  left: { xs: 0, sm: "50%" },
  right: { xs: 0, sm: "auto" },
  transform: { xs: "none", sm: "translate(-50%, 50%)" },
  width: { xs: "100%", sm: 440 },
  maxWidth: { xs: "100%", sm: "calc(100vw - 32px)" },
  maxHeight: { xs: "92vh", sm: "calc(100vh - 32px)" },
  overflowY: "auto",
  bgcolor: "background.paper",
  border: "none",
  boxShadow: "0 24px 64px rgba(15,23,42,0.18)",
  p: { xs: 3, sm: 4 },
  borderRadius: { xs: "20px 20px 0 0", sm: "24px" },
};

interface CategoryCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

type CreateMode = "single" | "bulk";

const CategoryCreateModal: React.FC<CategoryCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<CreateMode>("single");
  const [categoryType, setCategoryType] = useState<string>("EXPENSE");
  const { classifications } = useClassifications();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(getRandomColor());
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const [keepCreating, setKeepCreating] = useState(true);
  const [bulkInput, setBulkInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const parsedBulkNames = useMemo(() => {
    const seen = new Set<string>();
    return bulkInput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((line) => {
        if (seen.has(line)) return false;
        seen.add(line);
        return true;
      });
  }, [bulkInput]);

  const resetSingleForm = (preserveColor = true) => {
    setName("");
    setDescription("");
    setColor((currentColor) =>
      preserveColor ? currentColor : getRandomColor(),
    );
    setDisplayColorPicker(false);
  };

  const resetAll = () => {
    setMode("single");
    setCategoryType("EXPENSE");
    resetSingleForm(false);
    setKeepCreating(true);
    setBulkInput("");
    setLoading(false);
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const handleSingleSubmit = async () => {
    await categoryApi.createCategory({
      name,
      description: description || undefined,
      color: color || undefined,
      type: categoryType,
    });
    await onSuccess();

    if (keepCreating) {
      setSuccess("카테고리를 저장했습니다. 다음 카테고리를 바로 추가해 보세요.");
      resetSingleForm(false);
      return;
    }

    setSuccess("카테고리가 성공적으로 추가되었습니다.");
    handleClose();
  };

  const handleBulkSubmit = async () => {
    if (parsedBulkNames.length === 0) {
      setError("한 줄에 하나씩 카테고리 이름을 입력해 주세요.");
      return;
    }

    for (const categoryName of parsedBulkNames) {
      await categoryApi.createCategory({
        name: categoryName,
        color: getRandomColor(),
        type: categoryType,
      });
    }
    await onSuccess();

    setSuccess(`${parsedBulkNames.length}개의 카테고리를 한 번에 추가했습니다.`);
    setBulkInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "single") {
        await handleSingleSubmit();
      } else {
        await handleBulkSubmit();
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      if (axios.isAxiosError(axiosError) && axiosError.response) {
        setError(`카테고리 추가 실패: ${axiosError.response.data?.message ?? axiosError.message}`);
      } else {
        setError("카테고리 추가 중 예상치 못한 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      aria-labelledby="category-create-modal-title"
    >
      <Box sx={style} component="form" onSubmit={(e) => void handleSubmit(e)}>
        <Typography id="category-create-modal-title" variant="h5" component="h2" mb={1}>
          새 카테고리 추가
        </Typography>

        <Typography color="text.secondary" variant="body2" mb={2.5}>
          개별로 만들거나, 여러 줄을 붙여넣어 한 번에 생성할 수 있습니다.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* 수입 / 지출 구분 선택 */}
        <Box mb={2.5}>
          <Typography variant="body2" color="text.secondary" mb={1} fontWeight={600}>
            분류
          </Typography>
          <ToggleButtonGroup
            exclusive
            value={categoryType}
            onChange={(_, value: string | null) => { if (value) setCategoryType(value); }}
            size="small"
            fullWidth
          >
            {(classifications.length > 0 ? classifications : FALLBACK_CLASSIFICATIONS).map((cls) => (
              <ToggleButton key={cls.name} value={cls.name} sx={{ fontWeight: 700, ...TYPE_SOLID_STYLE(cls.name) }}>
                {TYPE_LABEL[cls.name] ?? cls.name}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        <Tabs
          value={mode}
          onChange={(_, value: CreateMode) => {
            setMode(value);
            setError(null);
            setSuccess(null);
          }}
          sx={{ mb: 2 }}
        >
          <Tab value="single" label="개별 추가" />
          <Tab value="bulk" label="빠른 일괄 추가" />
        </Tabs>

        {mode === "single" ? (
          <>
            <FormControlLabel
              sx={{ mb: 1 }}
              control={
                <Switch
                  checked={keepCreating}
                  onChange={(e) => setKeepCreating(e.target.checked)}
                />
              }
              label="연속해서 추가하기"
            />

            <TextField
              fullWidth
              autoFocus
              label="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="설명"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              margin="normal"
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="색상"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                margin="normal"
                onClick={() => setDisplayColorPicker(true)}
                InputProps={{ readOnly: true }}
              />
              <Box
                sx={{ width: 40, height: 40, bgcolor: color, border: "1px solid #ccc", borderRadius: 1, mt: 1, cursor: "pointer" }}
                onClick={() => setDisplayColorPicker(true)}
              />
            </Box>

            {displayColorPicker && (
              <ClickAwayListener onClickAway={() => setDisplayColorPicker(false)}>
                <Box sx={{ zIndex: 2, width: "fit-content", marginBottom: 3 }}>
                  <ChromePicker color={color} onChange={(nextColor) => setColor(nextColor.hex)} />
                </Box>
              </ClickAwayListener>
            )}
          </>
        ) : (
          <>
            <TextField
              fullWidth
              autoFocus
              multiline
              minRows={8}
              label="카테고리 이름을 한 줄에 하나씩 입력"
              placeholder={"식비\n교통비\n쇼핑\n통신비\n의료비"}
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Typography variant="body2" color="text.secondary" mb={1}>
              빈 줄은 무시하고, 중복 이름은 한 번만 추가합니다. 색상은 각 항목마다 랜덤으로 자동 지정됩니다.
            </Typography>

            <Box sx={{ mb: 2, p: 2, borderRadius: 2, backgroundColor: "action.hover" }}>
              <Typography fontWeight={700} mb={1}>미리보기</Typography>
              {parsedBulkNames.length > 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {parsedBulkNames.length}개를 생성합니다: {parsedBulkNames.join(", ")}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  아직 추가할 카테고리가 없습니다.
                </Typography>
              )}
            </Box>
          </>
        )}

        <Box display="flex" justifyContent="space-between" gap={2}>
          <Button variant="contained" color="error" onClick={handleClose} sx={{ flexGrow: 1 }} disabled={loading}>
            취소
          </Button>
          <Button
            variant="contained"
            type="submit"
            sx={{ flexGrow: 1 }}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading
              ? "추가 중..."
              : mode === "bulk"
                ? `${parsedBulkNames.length || ""}개 한 번에 추가`
                : keepCreating
                  ? "저장 후 계속"
                  : "카테고리 추가"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default CategoryCreateModal;
