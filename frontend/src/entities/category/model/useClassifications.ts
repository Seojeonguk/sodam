import { useEffect, useState } from "react";
import axios from "axios";
import classificationApi from "../api/classificationApi";
import type { ClassificationResponse } from "../api/classification.types";

export const useClassifications = (accountBookId?: number | null) => {
  const [classifications, setClassifications] = useState<ClassificationResponse[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClassifications = async () => {
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
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.message);
        } else {
          setError("분류를 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchClassifications();
  }, [accountBookId]);

  const refetchClassifications = async () => {
    if (!accountBookId) {
      setClassifications([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await classificationApi.getClassifications(accountBookId);
      setClassifications(response);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.message);
      } else {
        setError("분류를 불러오는 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    classifications,
    loading,
    error,
    refetchClassifications,
  };
};
