import { Project, SourceFile } from "ts-morph";
import * as path from "path";
import * as fs from "fs";

const project = new Project({
  tsConfigFilePath: "tsconfig.app.json",
});

function move(oldPath: string, newPath: string) {
  const sf = project.getSourceFile(oldPath);
  if (sf) {
    const absNewPath = path.resolve(process.cwd(), newPath);
    console.log(`[FILE] ${oldPath} -> ${absNewPath}`);
    sf.move(absNewPath);
  } else {
    console.warn(`[WARN] File not found: ${oldPath}`);
  }
}

function moveDirFiles(oldDir: string, newDir: string) {
  const dir = project.getDirectory(oldDir);
  if (dir) {
    const files = dir.getDescendantSourceFiles();
    files.forEach(sf => {
      const relPath = path.relative(dir.getPath(), sf.getFilePath());
      const newPath = path.join(newDir, relPath).replace(/\\/g, '/');
      const absNewPath = path.resolve(process.cwd(), newPath);
      console.log(`[DIR_FILE] ${sf.getFilePath()} -> ${absNewPath}`);
      sf.move(absNewPath);
    });
  } else {
    console.warn(`[WARN] Dir not found: ${oldDir}`);
  }
}

// 1. App
move("src/App.tsx", "src/app/App.tsx");
move("src/main.tsx", "src/app/main.tsx");
move("src/vite-env.d.ts", "src/app/vite-env.d.ts");

// 2. Shared
move("src/utils/api.ts", "src/shared/api/api.ts");
move("src/constants/layout.ts", "src/shared/config/layout.ts");
move("src/hooks/useIsDesktop.ts", "src/shared/lib/useIsDesktop.ts");
move("src/features/dashboard/utils/format.ts", "src/shared/lib/format.ts");

// 3. Entities
// AccountBook
moveDirFiles("src/features/accountbook/context", "src/entities/accountbook/model");
moveDirFiles("src/features/accountbook/hooks", "src/entities/accountbook/model");
moveDirFiles("src/features/accountbook/services", "src/entities/accountbook/api");

// Category
moveDirFiles("src/features/category/hooks", "src/entities/category/model");
moveDirFiles("src/features/category/services", "src/entities/category/api");
move("src/features/category/components/CategoryList.tsx", "src/entities/category/ui/CategoryList.tsx");

// Transaction
moveDirFiles("src/features/transaction/hooks", "src/entities/transaction/model");
moveDirFiles("src/features/transaction/services", "src/entities/transaction/api");
move("src/features/transaction/components/TransactionList.tsx", "src/entities/transaction/ui/TransactionList.tsx");

// 4. Features
// Auth
moveDirFiles("src/features/login/services", "src/features/auth/api");

// Modals
const transactionModals = [
  "TransactionCreateModal.tsx",
  "TransactionDetailModal.tsx",
  "TransactionEditModal.tsx"
];
transactionModals.forEach(m => move(`src/features/transaction/components/${m}`, `src/features/transaction/ui/${m}`));

const categoryModals = [
  "CategoryCreateModal.tsx",
  "CategoryEditModal.tsx",
  "CategoryReplaceModal.tsx"
];
categoryModals.forEach(m => move(`src/features/category/components/${m}`, `src/features/category/ui/${m}`));

// 5. Widgets
move("src/components/layout/Header.tsx", "src/widgets/layout/ui/Header.tsx");
move("src/components/layout/SideBarDrawer.tsx", "src/widgets/layout/ui/SideBarDrawer.tsx");

// 6. Pages
move("src/pages/LoginPage.tsx", "src/pages/login/ui/LoginPage.tsx");
move("src/pages/SignupPage.tsx", "src/pages/signup/ui/SignupPage.tsx");
move("src/features/dashboard/DashboardPage.tsx", "src/pages/dashboard/ui/DashboardPage.tsx");
moveDirFiles("src/features/dashboard/components", "src/pages/dashboard/ui/components");

move("src/features/category/CategoryPage.tsx", "src/pages/category/ui/CategoryPage.tsx");
move("src/features/transaction/TransactionPage.tsx", "src/pages/transaction/ui/TransactionPage.tsx");


project.saveSync();
console.log("Migration script complete.");
