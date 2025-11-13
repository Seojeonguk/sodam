import { useState, useEffect } from "react";
import categoryApi from "../services/categoryApi";
import type { CategoryListResponse } from "../../transaction/services/category.types";
import axios from "axios";

export const useCategories = () => {
  const [categories, setCategories] = useState<CategoryListResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryApi.getCategories(0, 20);
      setCategories(response);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.message);
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      await categoryApi.deleteCategory(id);
      await fetchCategories(); // 삭제 후 목록 갱신
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw new Error(err.message);
      } else {
        throw new Error("카테고리 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  useEffect(() => {
    void fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refetchCategories: fetchCategories,
    deleteCategory,
  };
};
