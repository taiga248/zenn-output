---
title: "普段AWS触っている自分が、Cloudflareのサービスを整理してみた"
emoji: "☁️"
type: "tech"
topics: ["cloudflare", "typescript", "workers", "個人開発"]
published: false
publication_name: "sonicmoov"
---

## はじめに

業務では普段AWSを使っています。Lambda + DynamoDB + S3 + CloudFront + Cognito...と、要件に応じてサービスを組み合わせる設計にはある程度慣れています。

一方、本記事で扱う話題のCloudflareは触ったことがありませんでした。
ふんわりとした理解を説明できるレベルまでに底上げしたく、本記事はその整理も兼ね「何をどう組み合わせるべきか」の判断軸を中心にまとめたものになります。
※実務レベルの本格的な検証ではなく、あくまで個人開発で触ってみた範囲での整理

各サービスをイメージしやすいよう、普段AWSを使っている方向けに似た機能も併記しています。

## 各サービスの対応表

Cloudflareの開発者プラットフォームは、ここ数年で「エッジコンピューティング」から「フルスタックのアプリケーション基盤」へと進化しています。

| Cloudflare              | 役割                                   | 近しいAWSサービス                 |
| ----------------------- | -------------------------------------- | --------------------------------- |
| **Workers**             | エッジで動くコンピュート (V8 isolate)  | Lambda / Lambda@Edge              |
| **Pages**               | 静的サイト + SSRホスティング           | S3 + CloudFront / Amplify         |
| **D1**                  | SQLite製のサーバーレスSQL DB           | RDSの軽量版                       |
| **KV**                  | 結果整合性の低レイテンシKVS            | DynamoDBのシンプル版              |
| **R2**                  | オブジェクトストレージ                 | S3                                |
| **Durable Objects**     | 単一インスタンスのステートフルアクター | StepFunctions + DynamoDBが近い..? |
| **Queues**              | 非同期メッセージング                   | SQS                               |
| **Hyperdrive**          | 既存Postgres/MySQLへの高速接続         | RDS Proxy                         |
| **Analytics Engine**    | 簡易的なイベント集計・ログ分析         | CloudWatch Logs Insights          |
| **Rate Limiting Rules** | APIレート制限（WAFレベルで）           | AWS WAF（Rate-based Rules）       |

Workers本体の最大の特徴は、V8 isolateと呼ばれる技術による起動の速さです。
※V8 isolate：V8エンジン上でプロセスを分けずにメモリ空間だけを軽量に分離する仕組み

- Lambda コールドスタート：100〜1000ms程度
- Workers：[5ms未満](https://blog.cloudflare.com/eliminating-cold-starts-with-cloudflare-workers/#:~:text=under%205%20milliseconds.)で開始可能

[330以上のエッジロケーション](https://blog.cloudflare.com/500-tbps-of-capacity/)で動作するため、低レイテンシを実現しやすい構成になっています。

## データの置き場所、どれ使う?

CloudflareにはD1(DB)・KV(キャッシュ)・R2(ファイル)・Durable Objects(状態管理)・Analytics Engine(集計)と、データを扱うサービスが複数あります。何をしたいかによって選ぶべきものが変わるので、判断軸を整理します。

まず「データの形」で大きく分け、次に「アクセスパターン」で絞り込むと選びやすくなるかなと思います。

### 1. データの形式で選ぶ

| データの形                   | サービス    |
| ---------------------------- | ----------- |
| バイナリ(画像・ファイルなど) | R2          |
| 構造化データ(テーブル形式)   | 下記2で判断 |

### 2. 構造化データの場合、アクセスパターンで選ぶ

| アクセスパターン                             | サービス         | 補足                                        |
| -------------------------------------------- | ---------------- | ------------------------------------------- |
| SQLでJOINが必要                              | D1               | 1DBあたり10GB上限、増えたらDB分割で対応可能 |
| 読み取り中心・低頻度更新                     | KV               | 結果整合性、反映まで最大60秒程度            |
| 即時整合性が必要・複数クライアントで状態共有 | Durable Objects  | チャット・排他制御など                      |
| 集計・分析用途で、行単位のJOINは不要         | Analytics Engine | イベントの記録・集計に特化                  |

## おすすめ構成

フロントエンドはサービスの複雑さに応じてPagesへの載せ方を変えるのが基本です。

1ページだけの簡単なものならHTMLをそのまま置けばよく、シンプルな静的ビルドならReact+Vite、記事コンテンツ中心ならAstro、もう少し複雑な画面遷移が絡むならNext.jsのStatic Exportといった具合に、規模に応じて選べば十分です。

上記を踏まえて、個人開発向けに次の構成をサンプルとして記載します。

```
[Pages] ── フロントエンド(静的配信)
   │
[Workers] ── APIレイヤー(Honoで軽量にルーティング)
   │
   ├── [D1]    ── ユーザー・注文などの構造化データ
   ├── [KV]    ── セッション・各設定値のキャッシュ
   ├── [R2]    ── 画像・ファイル アップロード
   ├── [Queues]── 非同期処理(メール送信のキューイング等)
   └── [Durable Objects] ── リアルタイム機能(チャット、通知、排他制御)
        ┊
        ┊ (後から追加)
        ┊
      [Hyperdrive] ┄┄ 既存のPostgres/MySQL(RDSなど)
```

この構成が個人開発に向いている理由は、以下の3点です。

- **課金がシンプル**: Workers Paidプランは月$5からで、D1・KV・R2・Durable Objectsの基本利用枠がまとめて含まれている
- **運用の手間が少ない**: リクエストに応じて自動的にスケールしてくれる
- **段階的に機能を足していける**: 最初はWorkers+D1だけで始めて、必要になったらKVやR2、Durable Objectsを追加が可能

## 各サービスの要点(コード抜粋)

### Workers API(Hono)

今回は[公式](https://developers.cloudflare.com/workers/frameworks/framework-guides/hono/)でも紹介されているHonoを使ってみました。
Expressに近い書き味でルーティングが書けます。

```typescript
import { Hono } from "hono";

type Env = {
  DB: D1Database;
  SESSION_KV: KVNamespace;
  UPLOADS: R2Bucket;
};

const app = new Hono<{ Bindings: Env }>();

app.get("/api/users/:id", async (c) => {
  const { id } = c.req.param();
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?")
    .bind(id)
    .first();
  return c.json(user);
});

export default app;
```

### D1(Drizzle ORMでスキーマ定義)

TypeScriptの型と親和性が高く、`type`ベースでスキーマの型を扱える。

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

type User = typeof users.$inferSelect;
```

### KV(セッション管理)

```typescript
type SessionData = {
  userId: string;
  expiresAt: number;
};

await c.env.SESSION_KV.put(
  `session:${sessionId}`,
  JSON.stringify({ userId, expiresAt } satisfies SessionData),
  { expirationTtl: 3600 },
);
```

### R2(ファイルアップロード)

S3のAPIに近い感覚で使えつつ、エグレス課金が発生しないのがメリット

※ エグレス：保存したファイルが外部からダウンロードされる際の転送のこと。
多くのクラウドストレージ(S3含む)はこの転送量に応じて課金されるが、R2はここが無料

```typescript
app.post("/api/upload", async (c) => {
  const body = await c.req.arrayBuffer();
  const key = `uploads/${crypto.randomUUID()}`;
  await c.env.UPLOADS.put(key, body);
  return c.json({ key });
});
```

### Durable Objects(リアルタイム機能)

チャットルームや通知のように「複数クライアントが同じ状態を参照・更新する」ケースに向いています。D1やQueuesもDurable Objectsを基盤に構築されており、Cloudflareのストレージ製品群の中核を担う存在です。

```typescript
export class ChatRoom {
  private sessions: Set<WebSocket> = new Set();

  async fetch(request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    this.sessions.add(server);

    server.addEventListener("message", (event) => {
      for (const session of this.sessions) {
        session.send(event.data);
      }
    });

    return new Response(null, { status: 101, webSocket: client });
  }
}
```

## AWSとの使い分けの目安

既にAWS環境で大きなシステムを運用している場合、無理に全てをCloudflareに寄せる必要はありません。エッジコンピューティングとリージョン型のサーバーレスは対比されることが多いですが、実際は競合というより補完関係にあり、適材適所で使い分けるのが現実的だと考えています。例えば以下のような役割分担も一つの選択肢です。

- 低レイテンシが必要なグローバル向け機能 → Workers
- 複雑なビジネスロジックやAWSサービスとの連携が必要 → Lambda

個人開発の新規サービスであれば、まずCloudflare単体で始め、必要に応じてHyperdrive経由で既存DBと接続・移行するという選択肢も取りやすい設計になっています。

## まとめ

- AWSとの対応表を作ってみると、大半のサービスは既存のAWSサービスの延長でイメージできた一方、Durable Objectsだけは直接対応するAWSサービスがなく、Cloudflare特有の概念として理解する必要があった
- データを扱うサービス(D1/KV/R2/Durable Objects/Analytics Engine)は、「データの形」→「アクセスパターン」の2段階で絞り込むと選びやすい
- Workers Paidプラン1本でD1・KV・R2・Durable Objectsの基本枠がまとめて含まれる課金体系は、普段AWSでサービスごとの請求を追っている身からすると管理がシンプルで助かる
- 個人開発ならWorkers+D1から始めて、必要に応じてKV・R2・Durable Objectsを足していく設計が良いと感じた

## 参考

- [Cloudflare Workers 公式ドキュメント](https://developers.cloudflare.com/workers/)
- [Choosing a data or storage product](https://developers.cloudflare.com/workers/platform/storage-options/)
- [Durable Objects Overview](https://developers.cloudflare.com/durable-objects/)
