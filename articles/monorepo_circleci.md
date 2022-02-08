---
title: "monorepo環境でのCircleCI"
emoji: "🔄"
type: "tech"
topics: ["CircleCI", "monorepo", "CI", "CD"]
published: true
---

# CI/CD とは

ざっくりと

ソフトウェア開発手法の１つ
ビルドやテスト、デプロイなどの `「誰が叩いても同じ結果を得られる」`ものを自動化してくれる

- 継続的インテグレーション(CI)：コードをリポジトリに反映
- 継続的デリバリー(CD)：コード品質の保全
- 継続的デプロイメント(CD)：環境へのデプロイ

GitHub などのリポジトリサービスと連携して使用します。

# 小さな単位での CircleCI 実装

## ファイル構成

```
repository
  ├── .circleci
  │      └── config.yml
  ├── node_modules
  ├── src
  ├── package.json
```

## シンプルサンプル

```yml:config.yml
version: 2.1
jobs:
  lint:
    docker:
      - image: circleci/<language>:<version>
    steps:
      - checkout
      - run: npm run lint

  build:
    docker:
      - image: circleci/<language>:<version>
    steps:
      - checkout
      - run: npm run build


workflows:
  version: 2
  lint_and_build:
    jobs:
      - lint
      - build
```

`jobs`に実際に叩きたいコマンドを記述し、
`workflows`で実行する`jobs`の順番を制御しています。

上記コードは`lint`,`build`のコマンドを `docker image` 上で実行するコードになります。
`run`に記述したコマンドを叩くのに`checkout`で実行環境の中へ入る必要があります。

## 完成形サンプル

実務では下記のようなイメージで書かれています。

```yml:config.yml
version: 2.1

executors:
  frontend-executor:
    docker:
      - image: circleci/node:10.15.3

references:
  cache_key: &cache_key v1-dependencies-{{ checksum "package-lock.json" }}
  save_node_modules: &save_node_modules
    save_cache:
      paths:
        - node_modules
      key: *cache_key
  restore_node_modules: &restore_node_modules
    restore_cache:
      keys:
        - *cache_key
        - v1-dependencies-

workflows:
  version: 2
  sample:
    jobs:
      - package-install-and-lint
      - test:
          requires:
            - package-install-and-lint
      - build:
          requires:
            - package-install-and-lint
      - deploy:
          requires:
            - test
            - build
          filters:
            branches:
              only: main

jobs:
  package-install-and-lint:
    executor: frontend-executor
    steps:
      - checkout
      - *restore_node_modules
      - run: npm install
      - *save_node_modules
      - run: npm run lint
  build:
    executor: frontend-executor
    steps:
      - checkout
      - *restore_node_modules
      - *save_node_modules
      - run: npm run build
  test:
    executor: frontend-executor
    steps:
      - checkout
      - *restore_node_modules
      - *save_node_modules
      - run: npm run test:ci
      - store_test_results:
          path: reports
      - store_artifacts:
          path: coverage
  deploy:
    executor: frontend-executor
    steps:
      - checkout
      - *restore_node_modules
      - *save_node_modules
      - run: npm run deploy
```

### 追加要素説明

- `executors`： 実行環境を変数的に扱えるように

- `references`：今回では`node_modules`のキャッシュ戦略で使用
  パッケージのインストールは `job`毎に必要なので、 `npm install` を毎回叩いてもらわなければならない。 → 実行時間辛い → じゃ、キャッシュしてしまおう

- `requires`：指定した`job`の結果が返ってきた段階で実行されます。await みたいなやつです。

- `store_test_results`,`store_artifacts`：テストの結果を CircleCI 管理画面上で確認するできます。

# やっと本題、 Monorepo での CircleCI 実行

１つのディレクトリで複数プロジェクトを管理している状態
この管理状態を ”モノリポジトリ” と呼びます。

```
repository
├── frontend
│     ├── package.json
│     ├── node_modules
│     └── src
│
├─── backend
│     ├── package.json
│     ├── node_modules
│     └── src
```

CircleCI は設定ファイルを root に置く必要があるので、通常の使い方ではモノリポに対応できません。

そこでこちらを使用します。
https://github.com/labs42io/circleci-monorepo
コード変更があったプロジェクトの`job`のみが実行されるようになり、モノリポでの CircleCI 実行を可能にします。
変更検知は`circle_trigger.sh`の中で行われ、コミットハッシュ値で判断しているようです。

# 実装サンプル

https://github.com/taiga248/monorepo

```yml:config.yml
version: 2.1

parameters:
  # 変更検知フラグ
  trigger:
    type: boolean
    default: true
  # 各プロジェクト分のフラグを用意する
  demo:
    type: boolean
    default: false
  sample:
    type: boolean
    default: false

# 実行環境
executors:
  node:
    docker:
      - image: circleci/node:10.15.3

jobs:
  # 差分検知用シェル実行
  trigger-workflows:
    executor: node
    steps:
      - checkout
      - run:
          name: Trigger workflows
          command: chmod +x .circleci/circle_trigger.sh && ls -l .circleci && .circleci/circle_trigger.sh

  package-install-and-lint:
    parameters:
      package_name:
        type: string
    executor: node
    steps:
      - checkout:
          path: ~/monorepo
      - run:
          name: Package install
          command: npm install
          working_directory: ~/monorepo/<< parameters.package_name >>
      - run:
          name: Lint
          command: npm run lint
          working_directory: ~/monorepo/<< parameters.package_name >>

  echo:
    parameters:
      package_name:
        type: string
    executor: node
    steps:
      - checkout:
          path: ~/monorepo
      - run:
          name: Echo
          command: echo "This working_directory is '<< parameters.package_name >>''"
          working_directory: ~/monorepo/<< parameters.package_name >>

workflows:
  version: 2
  ci:
    when: << pipeline.parameters.trigger >>
    jobs:
      - trigger-workflows

  # 変更検知されたプロジェクトのjobが走る
  demo:
    when: << pipeline.parameters.demo >>
    jobs:
      - package-install-and-lint:
          name: demo-install-lint
          package_name: demo

      - echo:
          name: demo-echo
          package_name: demo

  sample:
    when: << pipeline.parameters.sample >>
    jobs:
      - package-install-and-lint:
          name: sample-install-lint
          package_name: sample

      - echo:
          name: sample-echo
          package_name: sample
```

実際に変更を加え、push してみましょう。
差分が検知されたプロジェクトの CI が走るのを確認できることかと思います。
![](https://user-images.githubusercontent.com/38455912/153040471-fa43b5d2-51d2-4607-8cef-ac5df40dd47a.png)

# おまけ

## config ファイルのバリデーションチェック

yml ファイルの構文が間違っていないか、 push して CircleCI 上で確認するのは面倒なのでコマンドで確認するようにしましょう。
`$ circleci config validate`
