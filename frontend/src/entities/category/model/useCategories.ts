import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import categoryApi from "../api/categoryApi";
import type { CategoryListResponse } from "../../transaction/api/category.types";
import { useAccountBookContext } from "../../accountbook/model/AccountBookContext";

export const useCategories = () => {
  const [categories, setCategories] = useState<CategoryListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentAccountBook } = useAccountBookContext();

  const fetchCategories = useCallback(async () => {
    if (!currentAccountBook?.id) {
      setCategories(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await categoryApi.getCategories(0, 20);
      setCategories(response);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.message);
      } else {
        setError("카테고리를 불러오는 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, [currentAccountBook?.id]);

  const deleteCategory = async (id: number, replacementId: number) => {
    try {
      await categoryApi.deleteCategory(id, replacementId);
      await fetchCategories();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw new Error(err.message);
      }

      throw new Error("카테고리 삭제 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetchCategories: fetchCategories,
    deleteCategory,
  };
};
