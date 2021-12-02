---
title: "jQueryで爆速フォームバリデーション"
emoji: "🚤"
type: "tech"
topics: ["validate", "jQuery"]
published: true
---

# なんで今さら jQuery の記事???

- Bootstrap との親和性が高く、導入の手軽さ等でまだまだ現役だと感じたから
- jQuery に触れたことなかったので、そのアウトプット

[jQuery Validation Plugin 公式](https://jqueryvalidation.org/)

# セットアップ

今回は jQuery を npm で管理

```shell
$ npm init -y
$ npm i jquery
$ npm i jquery-validation
$ tree
.
├── index.html
├── node_modules - ..
├── package.json
└── validate-config.js

```

## 最小単位でのバリデーション実装

input が空の状態で submit すると「入力必須項目です」とエラーが表示される。

```html:index.html
<form id="form_id" method="post">
  <input type="text" name="text_name" />
  <button type="submit">送信</button>
</form>

<script src="./node_modules/jquery/dist/jquery.min.js"></script>
<script src="./node_modules/jquery-validation/dist/jquery.validate.min.js"></script>
<script src="./validate-config.js"></script>
```

```js:validate-config.js
$("form_id").validate({
  rules: {
    text_name: {
      required: true,
    },
  },
  messages: {
    text_name: {
      required: "入力必須項目",
    },
  },
});
```

### 説明

```js
$("バリデーション対象フォームid").validate({
  rules: {
    input要素のname: {
      有効化するルール: true,
    },
  },
  messages: {
    input要素のname: {
      有効化するルール: "エラーとして表示したい文言",
    },
  },
});
```

ｵﾃｶﾞﾙﾀﾞﾅｰ

# カスタマイズ

## エラー文字に class 付与

文字を赤くするクラスを指定

```diff js:validate-config.js
...
      required: "入力必須項目です",
    },
  },
+ errorClass: "validation-error",
 });
```

```css:style.css
.validation-error {
  color: rgb(255, 69, 58);
}
```

## エラーの表示要素

デフォルトでは label 要素で表示される - [document](https://jqueryvalidation.org/validate/#errorelement)
span 指定おすすめ

```diff js:validate-config.js
...
      required: "入力必須項目",
    },
  },
  errorClass: "validation-error",
+ errorElement: "span",
 });
```

## エラーの表示位置

デフォルトでは input 要素の右側に表示される。
input 要素にカスタムデータ属性を付与すると、エラーの表示位置を自由に決めることができる。
例として `h1`要素を跨いだ先の slot 要素に表示する。

`appendTo`の他に`insertAfter`や`insertAfter`で要素の前後指定も可能

```diff html:index.html
 <form id="form_id" method="post">
+  <span id="textError"><!-- error message --></span>
+  <input type="text" name="text_name" data-error_place="#textError" />
-  <input type="text" name="text_name" />
   <h1>hello</h1>
   <span id="textError">
   <button type="submit">送信</button>
 </form>
```

:::message

#(シャープ)必須なので注意 `data-error_place="#textError"`
:::

```diff js:validate-config.js
...
       required: "入力必須項目です",
     },
   },
  errorClass: "validation-error",
  errorElement: "span",
+ errorPlacement: function (error, element) {
+   error.appendTo(element.data("error_place"));
+ },
 });
```

### `errorPlacement`の引数

- error：挿入対要素
- element：validation 対象の input 要素

## 用意されている既存のルール

[⭐ jQuery Validation Documentation ⭐](https://jqueryvalidation.org/documentation/#link-list-of-built-in-validation-methods)
https://jqueryvalidation.org/documentation/#link-list-of-built-in-validation-methods

```js:validate-config.js
...
  rules: {
    text_name: {
      required: true,
    },
    email: {
      required: true,
      email: true,
    },
    age:{
      required: true,
      range: [0,100],
    }
...
```

## オリジナルルール追加

下記のルールは半角英数字のみを受け付けるもの

```js:validate-config.js
$.validator.addMethod(
  "alphaNum",
  function (value, element) {
    return this.optional(element) || /^([a-zA-Z0-9]+)$/.test(value);
  },
  "半角英数字を入力してください"
);
```

### 説明

```js
$.validator.addMethod(
  "追加したいルールの名前",
  // (val, el) => {... 無名関数は❌
  function (value, element) {
    // JSが書けるため他のinput要素の情報を取得、比較等も可能になる。
    return this.optional(element) || /何かしらの正規表現/.test(value);
  },
  "表示させたい文言"
);
```

## バリデーションルール サンプル

```js:validate-config.js
$.validator.addMethod(
  "alphaNum",
  function (value, element) {
    return this.optional(element) || /^([a-zA-Z0-9]+)$/.test(value);
  },
  "半角英数字を入力してください"
);

$("#form_id").validate({
  rules: {
    text_name: {
      required: true,
    },
    email: {
      required: true,
      email: true,
    },
    password: {
      required: true,
      minlength: 8,
      alphaNum: true,
    },
  },
  messages: {
    text_name: {
      required: "入力必須項目です",
    },
    email: {
      required: "メールアドレスを入力してください",
      email: "有効なメールアドレスを入力してください",
    },
    password: {
      required: "パスワードが未入力です",
      minlength: "8文字以上必要です",
    },
  },
  errorClass: "validation-error",
  errorElement: "span",
  errorPlacement: function (error, element) {
    error.appendTo(element.data("error_place"));
  },
});

```

```html: index.html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="style.css" />
    <title>jQuery Validation</title>
  </head>
  <body>
    <form id="form_id" action="#" method="post">
      <div>
        <label for="text_name">名前</label>
        <input type="text" name="text_name" data-error_place="#textError" />
        <span id="textError"></span>
      </div>
      <div>
        <label for="email">メールアドレス</label>
        <input type="text" name="email" data-error_place="#emailError" />
        <span id="emailError"></span>
      </div>
      <div>
        <label for="password">パスワード</label>
        <input type="password" name="password" data-error_place="#passwordError" />
        <span id="passwordError"></span>
      </div>
      <button type="submit">送信</button>
    </form>

    <script src="./node_modules/jquery/dist/jquery.min.js"></script>
    <script src="./node_modules/jquery-validation/dist/jquery.validate.min.js"></script>
    <script src="./validate-config.js"></script>
  </body>
</html>

```
