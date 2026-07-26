---
title: "LINE Messaging API - コピペで使える構成サンプル集"
emoji: "💬"
type: "tech"
topics: ["LINE", "MessagingAPI", "FlexMessage", "TemplateMessage"]
published: true
publication_name: "sonicmoov"
---

# LINE Messaging API — コピペで使える構成サンプル集

Flex Message・Template Message のJSONサンプルと、見た目の対応をまとめたページです。
気になるサンプルをそのままコピペして使ってください。

> プロパティの完全な仕様は [LINE Messaging API Reference](https://developers.line.biz/en/reference/messaging-api/#flex-message) を参照してください。

## 動作確認の方法

サンプルの見た目を確認する方法は、メッセージの種類によって異なります。

**Flex Message** は **Flex Message Simulator** でプレビューを確認可能です。
※このシュミレータは後述するFlexMessage専用

<https://developers.line.biz/flex-simulator/>

上記サイト上で、Flex Message の `contents` の中身（`bubble` や `carousel` オブジェクト）をそのまま貼り付けることで見た目を確認することができます。

**Flex Message Simulator では確認できないもの**

- Template Message 全種
- 通常メッセージ（テキスト／画像／スタンプ等）
- Quick Reply／sender 付きメッセージ

:::message
上記はSimulator上でプレビューを確認することができません。
これらは Webhook で送るか、記事末尾の [シミュレータ非対応のメッセージ動作確認用スクリプト](#シミュレータ非対応のメッセージ動作確認用スクリプト) で確認が可能です。
:::

## メッセージの種類

LINE Messaging API で送れるメッセージの種類は以下のとおりです。

この記事では **Template Message** と **Flex Message** を中心に扱います。

| 種類                   | 概要                                                         |
| ---------------------- | ------------------------------------------------------------ |
| **テキスト**           | 文字だけのシンプルなメッセージ。絵文字・メンションも使えます |
| **画像 / 動画 / 音声** | メディアファイルを1つ送ります                                |
| **スタンプ**           | LINEスタンプを送ります                                       |
| **位置情報**           | 地図上のピンとして表示されます                               |
| **Template Message**   | ボタン・確認ダイアログなど固定レイアウトのUIです             |
| **Flex Message**       | CSS Flexboxベースで自由にレイアウトを組めるリッチUIです      |

## Template Message と Flex Message の違い

|                    | Template Message                  | Flex Message                   |
| ------------------ | --------------------------------- | ------------------------------ |
| レイアウトの自由度 | 低い（固定レイアウト）            | 高い（自由に組める）           |
| JSONの複雑さ       | シンプル                          | ネストが深くなりやすい         |
| 向いているケース   | 2択確認・シンプルなボタンメニュー | 通知カード・予約確認・商品紹介 |

# Flex Message

## 基本形：Bubble（1枚のカード）

Flex Messageの送信オブジェクトの基本形です。

```json
{
  "type": "flex",
  "altText": "通知テキスト",
  "contents": {
    "type": "bubble",
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [{ "type": "text", "text": "Hello, World!" }]
    }
  }
}
```

`contents` の中に `bubble` を置くと1枚のカードになります。
Bubbleは **header / hero / body / footer** の4ブロックで構成されており、使いたいブロックだけ定義すれば問題ありません。

![Bubbleの構成（header / hero / body / footer）](/images/line-messaging-api/1.webp)

### レイアウトの基本：Box の layout

すべてのレイアウトは `box` の `layout` プロパティで制御します。

**縦積み（vertical）**

```json
{
  "type": "box",
  "layout": "vertical",
  "contents": [
    { "type": "text", "text": "タイトル", "weight": "bold", "size": "xl" },
    { "type": "text", "text": "サブテキスト", "color": "#888888" }
  ]
}
```

テキストが上から縦に積み重なります。

**横並び（horizontal）**

```json
{
  "type": "box",
  "layout": "horizontal",
  "contents": [
    { "type": "text", "text": "ラベル", "color": "#888888", "flex": 2 },
    { "type": "text", "text": "値", "flex": 3 }
  ]
}
```

左右に並びます。`flex` の数値が幅の比率になります（この例では 2:3）。

## 1. サンプル：通知カード

```json
{
  "type": "bubble",
  "header": {
    "type": "box",
    "layout": "vertical",
    "backgroundColor": "#1DB446",
    "contents": [
      {
        "type": "text",
        "text": "注文確認",
        "color": "#ffffff",
        "weight": "bold",
        "size": "xl"
      }
    ]
  },
  "body": {
    "type": "box",
    "layout": "vertical",
    "spacing": "md",
    "contents": [
      { "type": "separator" },
      {
        "type": "box",
        "layout": "horizontal",
        "contents": [
          { "type": "text", "text": "商品名", "color": "#888888", "flex": 2 },
          { "type": "text", "text": "サンプル商品A", "flex": 5 }
        ]
      },
      {
        "type": "box",
        "layout": "horizontal",
        "contents": [
          { "type": "text", "text": "金額", "color": "#888888", "flex": 2 },
          { "type": "text", "text": "¥3,980", "flex": 5 }
        ]
      }
    ]
  },
  "footer": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      {
        "type": "button",
        "style": "primary",
        "color": "#1DB446",
        "action": {
          "type": "uri",
          "label": "配送状況を確認",
          "uri": "https://example.com/tracking"
        }
      }
    ]
  }
}
```

**見た目イメージ**：

![通知カードの見た目イメージ](/images/line-messaging-api/2.webp)

- `header` に `backgroundColor` を指定すると色帯になります。
- `footer` のボタンは `style: "primary"` で塗りつぶし、`style: "link"` でテキストのみになります。
- `separator` で区切り線を引けます。

## 2. サンプル：メイン画像付きカード

```json
{
  "type": "bubble",
  "hero": {
    "type": "image",
    "url": "https://placehold.jp/150x150.png",
    "size": "full",
    "aspectRatio": "20:13",
    "aspectMode": "cover"
  },
  "body": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      { "type": "text", "text": "商品名", "weight": "bold", "size": "xl" },
      { "type": "text", "text": "¥3,980", "size": "lg", "color": "#e74c3c" }
    ]
  }
}
```

**見た目イメージ**：

![メイン画像付きカードの見た目イメージ](/images/line-messaging-api/3.webp)

- `aspectMode: "cover"` で画像が枠いっぱいにトリミングされます。
- `"fit"` にすると画像全体が収まるよう余白が入ります。

## 3. サンプル：カルーセル（複数カードを横スクロール）

`contents` の `type` を `carousel` に変えると、複数のBubbleを横スクロールで並べられます。

```json
{
  "type": "flex",
  "altText": "おすすめ商品",
  "contents": {
    "type": "carousel",
    "contents": [
      {
        "type": "bubble",
        "hero": {
          "type": "image",
          "url": "https://placehold.jp/150x150.png",
          "size": "full",
          "aspectRatio": "1:1",
          "aspectMode": "cover"
        },
        "body": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            { "type": "text", "text": "商品A", "weight": "bold" },
            { "type": "text", "text": "¥1,980", "color": "#e74c3c" }
          ]
        },
        "footer": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "button",
              "style": "primary",
              "action": {
                "type": "uri",
                "label": "詳細を見る",
                "uri": "https://example.com/item1"
              }
            }
          ]
        }
      },
      {
        "type": "bubble",
        "hero": {
          "type": "image",
          "url": "https://placehold.jp/150x150.png",
          "size": "full",
          "aspectRatio": "1:1",
          "aspectMode": "cover"
        },
        "body": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            { "type": "text", "text": "商品B", "weight": "bold" },
            { "type": "text", "text": "¥2,480", "color": "#e74c3c" }
          ]
        },
        "footer": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "button",
              "style": "primary",
              "action": {
                "type": "uri",
                "label": "詳細を見る",
                "uri": "https://example.com/item2"
              }
            }
          ]
        }
      }
    ]
  }
}
```

**見た目イメージ**：

![カルーセルの見た目イメージ](/images/line-messaging-api/4.webp)

- `contents` の配列にBubbleを追加するだけで枚数を増やせます。
- 最大12枚まで設定できます。

# Template Message（定型レイアウト）

Flex Messageより手軽に書ける定型レイアウトです。
レイアウトの自由度は低いですが、シンプルなUIであればこちらで十分なケースも多いです。
種類は4つ存在します。

## 4. サンプル：Buttons Template

画像・タイトル・テキスト・ボタン複数をセットにした縦型レイアウトです。

```json
{
  "type": "template",
  "altText": "メニューを選んでください",
  "template": {
    "type": "buttons",
    "thumbnailImageUrl": "https://placehold.jp/150x150.png",
    "title": "メニュー",
    "text": "ご希望のメニューを選択してください",
    "actions": [
      { "type": "uri", "label": "詳細を見る", "uri": "https://example.com" },
      { "type": "message", "label": "お問い合わせ", "text": "お問い合わせ" },
      { "type": "postback", "label": "予約する", "data": "action=reserve" }
    ]
  }
}
```

**見た目イメージ**：

![Buttons Templateの見た目イメージ](/images/line-messaging-api/5.webp)

ボタンは最大4つまで設定できます。画像・タイトルは省略可能です。

## 5. サンプル：Confirm Template

「はい / いいえ」のような2択の確認ダイアログです。

```json
{
  "type": "template",
  "altText": "予約をキャンセルしますか？",
  "template": {
    "type": "confirm",
    "text": "予約をキャンセルしますか？",
    "actions": [
      { "type": "postback", "label": "はい", "data": "action=cancel" },
      { "type": "message", "label": "いいえ", "text": "いいえ" }
    ]
  }
}
```

**見た目イメージ**：

![Confirm Templateの見た目イメージ](/images/line-messaging-api/6.webp)

ボタンは必ず2つ必要です。

## 6. サンプル：Carousel Template

複数の Buttons Template を横スクロールで並べたレイアウトです。

```json
{
  "type": "template",
  "altText": "おすすめ商品",
  "template": {
    "type": "carousel",
    "columns": [
      {
        "thumbnailImageUrl": "https://placehold.jp/150x150.png",
        "title": "商品A",
        "text": "¥1,980",
        "actions": [
          {
            "type": "uri",
            "label": "詳細を見る",
            "uri": "https://example.com/item1"
          }
        ]
      },
      {
        "thumbnailImageUrl": "https://placehold.jp/150x150.png",
        "title": "商品B",
        "text": "¥2,480",
        "actions": [
          {
            "type": "uri",
            "label": "詳細を見る",
            "uri": "https://example.com/item2"
          }
        ]
      }
    ]
  }
}
```

**見た目イメージ**：

![Carousel Templateの見た目イメージ](/images/line-messaging-api/7.webp)

最大10カラムまで設定できます。各カラムのボタンは最大3つです。

## 7. サンプル：Image Carousel Template

画像のみを横スクロールで並べるシンプルなレイアウトです。

```json
{
  "type": "template",
  "altText": "ギャラリー",
  "template": {
    "type": "image_carousel",
    "columns": [
      {
        "imageUrl": "https://placehold.jp/150x150.png",
        "action": {
          "type": "uri",
          "label": "開く",
          "uri": "https://example.com/1"
        }
      },
      {
        "imageUrl": "https://placehold.jp/150x150.png",
        "action": {
          "type": "uri",
          "label": "開く",
          "uri": "https://example.com/2"
        }
      }
    ]
  }
}
```

**見た目イメージ**：

![Image Carousel Templateの見た目イメージ](/images/line-messaging-api/8.webp)

テキストやボタンは持てません。画像タップ時のアクションを1つだけ設定できます。最大10枚まで設定できます。

# オプション

メッセージオブジェクトや送信リクエストに追加できるオプションです。

**Flex Message Simulator では再現できません**
以下で紹介する Quick Reply と sender は、Simulator ではプレビューできません。

実際に LINE に送信して確認してください（後述のスクリプトや Webhook を利用できます）。

## Quick Reply（返答ボタン）

メッセージオブジェクトに `quickReply` を追加すると、メッセージの直下に選択肢ボタンが表示されます。
Flex Message に限らず、すべてのメッセージタイプで使えます。

```json
{
  "type": "flex",
  "altText": "アンケート",
  "contents": {
    "type": "bubble",
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        { "type": "text", "text": "ご満足いただけましたか？", "wrap": true }
      ]
    }
  },
  "quickReply": {
    "items": [
      {
        "type": "action",
        "action": { "type": "message", "label": "満足", "text": "満足" }
      },
      {
        "type": "action",
        "action": { "type": "message", "label": "普通", "text": "普通" }
      },
      {
        "type": "action",
        "action": { "type": "message", "label": "不満", "text": "不満" }
      }
    ]
  }
}
```

**見た目イメージ**：

![Quick Replyの見た目イメージ](/images/line-messaging-api/9.webp)

タップするとボタンが消えて、`text` に指定した文字列がメッセージとして送信されます。最大13個まで並べられます。

## sender（送信者アイコン・名前の変更）

送信リクエストに `sender` を追加すると、メッセージバブルの送信者アイコンと名前を変更できます。
Flex Message に限らず、すべてのメッセージタイプで使えます。

```json
{
  "to": "Uxxxx",
  "messages": [
    {
      "type": "text",
      "text": "こんにちは",
      "sender": {
        "name": "ここの名前を変更できます",
        "iconUrl": "https://placehold.jp/150x150.png"
      }
    }
  ]
}
```

**見た目イメージ**：

![senderの見た目イメージ](/images/line-messaging-api/10.webp)

名前には自動で「from 公式アカウント名」が付与されます。
ユーザーが公式アカウントと個人を混同しないようにするための仕様です。

変わるのはメッセージバブル内の表示だけで、トーク一覧・友達リスト・検索結果のアイコンや名前はデフォルトのまま変わりません。

# シミュレータ非対応のメッセージ動作確認用スクリプト

- Channel アクセストークン
- LINE User ID
- メッセージ JSON

上記3点を指定して、プッシュメッセージを送信するスクリプトです。
Quick Reply や sender 付きメッセージの確認に使えます。

**使い方**

```bash
send-line-message.sh <CHANNEL_ACCESS_TOKEN> <LINE_USER_ID> <messages.json>
```

**スクリプト本体**（`scripts/send-line-message.sh`）

```bash
#!/usr/bin/env bash
# 使い方: send-line-message.sh <CHANNEL_ACCESS_TOKEN> <LINE_USER_ID> <messages.json>

set -euo pipefail

if [ $# -ne 3 ]; then
  echo "Usage: $0 <CHANNEL_ACCESS_TOKEN> <LINE_USER_ID> <messages.json>"
  exit 1
fi

TOKEN="$1"
USER_ID="$2"
JSON_FILE="$3"

if [ ! -f "$JSON_FILE" ]; then
  echo "Error: File not found: $JSON_FILE"
  exit 1
fi

MESSAGES=$(jq -c 'if type == "array" then . else [.] end' "$JSON_FILE")
BODY=$(jq -n --arg uid "$USER_ID" --argjson msgs "$MESSAGES" '{to: $uid, messages: $msgs}')

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$BODY" \
  "https://api.line.me/v2/bot/message/push")

HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "Sent successfully (HTTP $HTTP_CODE)"
else
  echo "Error (HTTP $HTTP_CODE): $HTTP_BODY"
  exit 1
fi
```

- **CHANNEL_ACCESS_TOKEN**：LINE Developers Console で発行したアクセストークン
- **LINE_USER_ID**：送信先の User ID（Webhook の `source.userId` などで取得）
- **messages.json**：送信するメッセージの JSON（1件のオブジェクト、またはオブジェクトの配列）
