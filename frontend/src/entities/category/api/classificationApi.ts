import api from "../../../shared/api/api";
import type { CommonResponse } from "../../../shared/api/response.types";
import type { ClassificationResponse } from "./classification.types";

const CLASSIFICATION_BASE_URL = "/classifications";

const classificationApi = {
  getClassifications: async (
    accountBookSeq: number,
  ): Promise<
    CommonResponse<ClassificationResponse[]>
  > => {
    const response = (await api.get<CommonResponse<ClassificationResponse[]>>(
      `${CLASSIFICATION_BASE_URL}?accountBookSeq=${accountBookSeq}`,
    )) as unknown as CommonResponse<ClassificationResponse[]>;
    return response;
  },
};

export default classificationApi;
