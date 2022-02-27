---
title: "楽天モバイルのサービスエリアマップを支える技術"
emoji: "🌏"
type: "tech"
topics: ["GoogleMapsAPI"]
published: true
---

# エリアマップってなんぞや？

名前もそのまま、楽天モバイルの電波が届く範囲を確認できるマップのことです。
[楽天モバイル エリアマップ](https://network.mobile.rakuten.co.jp/area/)
![楽天モバイルサービスエリアマップ画像](https://user-images.githubusercontent.com/38455912/155760167-bd3c0ded-3932-405e-bdd4-e694dc2bf4c4.png)

## どうやって実装している？

## ざっくり

[Maps JavaScript API](https://developers.google.com/maps/documentation/javascript?hl=ja) を使用し、Google マップ上にピンク色の画像を重ねて表現しています。

## ちょっとくわしく

### 説明を理解するのに必要な知識

#### 1. Zoom レベル

マップの 拡大・縮小 の度合いを表す値です。
[こちらの記事がとても見やすくまとめてくださっています](https://qiita.com/SnowMonkey/items/795779913be692c12a0b)
`0 <= zoomLevel <= 21`

#### 2. Google マップの座標

Google マップは正方形の画像の組み合わせで構成されており、この正方形の画像 1 枚 1 枚をタイルと呼びます。
このタイルの座標を元に、領域画像を重ねることでエリアマップを表現しています。

タイル情報：`(x座標, y座標) : Zoom Level`

![マップ画像](https://user-images.githubusercontent.com/38455912/154842001-b7bed08f-1d65-4412-a94d-d1aa9be6d9f5.png)

こちらのサイトで実際にマップを操作しながら座標情報を確認することができます。
https://maptiler.jp/google-maps-coordinates-tile-bounds-projection/#8/44.81/56.32

#### 3. 領域画像

> マップの座標について

で説明したタイルの枚数分の領域画像を用意する必要があります。
[楽天モバイル エリアマップ](https://network.mobile.rakuten.co.jp/area/)を開いて Network タブを見てみると、領域画像を取得しているのが確認できることかと思います。
![タイル](https://user-images.githubusercontent.com/38455912/155762196-71821d2d-b0a6-4b55-9134-5914bf8941a8.png)

座標(x, y), Zoom レベルを元に S3 などから参照取得していると思われます。
`例：https://hogehoge.s3.ap-northeast-1.amazonaws.com/map-tile/{zoomLevel}/{x}/{y}.png`

### サンプルコード

```js:index.js
function initMap() {
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 5,
    maxZoom: 20,
    minZoom: 4,
    center: { lat: 37, lng: 140 },
  });
  const imageMap = new google.maps.ImageMapType({
    getTileUrl(coord, zoom) {
      const srcPath = `/imagePath`;
      return `${srcPath}/${zoom}/${coord.x}/${coord.y}.png`;
    },
  });
  map.overlayMapTypes.push(imageMap);
}

initMap();
```

取得した `API_KEY` を適宜代入してください。

```html:index.html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="http://maps.google.com/maps/api/js?key={API_KEY}"></script>
    <title>GoogleMapsAPI Sample</title>
  </head>
  <body>
    <div id="map"></div>
    <script src="index.js"></script>
  </body>
</html>
```

是非試してみてください！ :)
