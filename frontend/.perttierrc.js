module.exports = {
  printWidth: 100, // 한 줄에 최대 100자 허용
  tabWidth: 2, // 탭 대신 스페이스 사용 시 2칸 들여쓰기
  useTabs: false, // 탭 대신 스페이스 사용
  semi: true, // 문장 끝에 세미콜론 사용
  singleQuote: true, // 문자열에 작은따옴표 사용
  trailingComma: "all", // 가능한 모든 곳에 후행 쉼표 사용
  bracketSpacing: true, // 객체 리터럴 괄호 사이에 공백 사용
  arrowParens: "avoid", // 화살표 함수 매개변수 하나일 때 괄호 생략
  jsxBracketSameLine: false, // JSX 닫는 괄호는 다음 줄에
  endOfLine: "lf", // OS에 따라 줄바꿈 문자를 'lf'로 통일 (Windows 사용 시 CRLF 문제 방지)
  // proseWrap: "always", // 마크다운과 같은 산문 텍스트 자동 줄바꿈 (기본값: 'preserve')
  overrides: [
    {
      files: "*.json", // 모든 JSON 파일에 적용
      options: {
        tabWidth: 4, // JSON 파일은 4칸 들여쓰기
      },
    },
    {
      files: "*.md", // 마크다운 파일에 적용
      options: {
        proseWrap: "always", // 마크다운 텍스트 자동 줄바꿈
      },
    },
  ],
};
