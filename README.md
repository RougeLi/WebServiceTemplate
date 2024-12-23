# Line Bot

### 處理Line Bot的後端應用程式，例如接收Webhook事件、處理非同步事件、回覆訊息等。

`摘要`:

- [安裝](#安裝)
- [腳本命令](#腳本命令)
- [環境變數](#環境變數)
- [開發](#開發)
- [資料庫生成與遷移](#資料庫生成與遷移)

---

## 安裝

### 系統需求

- 確保已安裝正確版本的 Node.js。您可以參考 `.nvmrc` 檔案以了解具體版本。
- 全域安裝 [pnpm](https://pnpm.io/)：

  ```bash
  npm install -g pnpm
  ```

### 安裝步驟

1. **克隆儲存庫並進入專案目錄：**

   ```bash
    git clone <repository_url>
   ```

   ```bash
    cd <project_directory>
   ```

2. **複製範例環境變數檔案：**

   ```bash
    cp .env.example .env
   ```

3. **部署本地開發環境：**  
   詳細資訊請參閱 [開發](#開發) 部分。

4. **安裝相依套件：**

   ```bash
    nvm use # 可選，根據 .nvmrc 切換至正確的 Node.js 版本，專案目前使用 v22.8
   ```

   ```bash
    pnpm run install:ci
   ```

5. **執行初始 TypeScript 編譯：**

   ```bash
    pnpm run build
   ```

6. **啟動開發伺服器：**

   ```bash
   pnpm start
   ```

## 腳本命令

此範本提供了有用的 pnpm 腳本命令，以協助開發和專案維護：

- **install:ci**：使用凍結的鎖定檔案安裝相依套件，適用於 CI 環境。

  ```bash
  pnpm install --frozen-lockfile
  ```

- **install:dev**：安裝相依套件而不凍結鎖定檔案，適用於開發。

  ```bash
  pnpm install --no-frozen-lockfile
  ```

- **build**：將 TypeScript 檔案編譯為 JavaScript。

  ```bash
  pnpm run build
  ```

- **start**：執行 TypeScript 編譯和伺服器，同時監控代碼變更。

  ```bash
  pnpm start
  ```

- **lint**：運行型別檢查和 Lint，用於 CI 流程。

  ```bash
  pnpm run lint
  ```

- **lint:fix**：自動修正程式碼格式和 Lint 問題。

  ```bash
  pnpm run lint:fix
  ```

- **unit-test**：使用 Jest 運行單元測試，確保程式碼功能正常。

  ```bash
  pnpm run unit-test
  ```

- **unit-test:coverage**：運行測試並生成覆蓋率報告，以驗證測試的完整性。

  ```bash
  pnpm run unit-test:coverage
  ```

## 環境變數

專案的環境設置存儲在 `.env` 檔案中。以下是範例配置：

```text
# Line Bot 應用程式名稱
APP_NAME=LineBot

# 應用程式環境
# Options: development, staging, production
APP_ENV=development

# 伺服器埠號
PORT=3000

# Line Bot 資料庫 URL
LINE_BOT_DATABASE_URL=postgresql://lineBotUser:lineBotPassword@localhost/line_bot_db
```

---

## 開發

### 設置本地 `PostgreSQL` 資料庫

1. **安裝 [Docker](https://www.docker.com/)。**

2. **導航至專案的 `.dev-app-projects` 目錄：**

   ```bash
    cd .dev-app-projects
   ```

3. **執行以下命令：**

   ```bash
    docker compose up -d
   ```

4. **初始化`LineBot`資料庫：** (同時可透過以下命令重置)

   ```bash
    pnpm run reset
   ```

---

## 資料庫生成與遷移

### 生成 `Prisma` 資料庫客戶端

  ```bash
  pnpm run generate
  ```

### 資料庫遷移

  ```bash
  pnpm run migrate
  ```
