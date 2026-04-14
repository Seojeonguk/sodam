import { useCallback, useEffect, useState } from "react";
import classificationApi from "../api/classificationApi";
import type { ClassificationResponse } from "../api/classification.types";
import { getServerErrorMessage } from "../../../shared/lib/serverState";

export const useClassifications = (accountBookId?: number | null) => {
  const [classifications, setClassifications] = useState<ClassificationResponse[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClassifications = useCallback(async () => {
    if (!accountBookId) {
      setClassifications([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await classificationApi.getClassifications(accountBookId);
      setClassifications(response);
    } catch (nextError) {
      setError(
        getServerErrorMessage(
          nextError,
          "분류를 불러오는 중 오류가 발생했습니다.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [accountBookId]);

  useEffect(() => {
    void fetchClassifications();
  }, [fetchClassifications]);

  return {
    classifications,
    loading,
    error,
    refetchClassifications: fetchClassifications,
  };
};
