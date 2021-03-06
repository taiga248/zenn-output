---
title: "monorepoç°å¢ã§ã®CircleCI"
emoji: "ð"
type: "tech"
topics: ["CircleCI", "monorepo", "CI", "CD"]
published: true
---

# CI/CD ã¨ã¯

ãã£ããã¨

ã½ããã¦ã§ã¢éçºææ³ã®ï¼ã¤
ãã«ãããã¹ããããã­ã¤ãªã©ã® `ãèª°ãå©ãã¦ãåãçµæãå¾ãããã`ãã®ãèªååãã¦ããã

- ç¶ç¶çã¤ã³ãã°ã¬ã¼ã·ã§ã³(CI)ï¼ã³ã¼ãããªãã¸ããªã«åæ 
- ç¶ç¶çããªããªã¼(CD)ï¼ã³ã¼ãåè³ªã®ä¿å¨
- ç¶ç¶çããã­ã¤ã¡ã³ã(CD)ï¼ç°å¢ã¸ã®ããã­ã¤

GitHub ãªã©ã®ãªãã¸ããªãµã¼ãã¹ã¨é£æºãã¦ä½¿ç¨ãã¾ãã

# å°ããªåä½ã§ã® CircleCI å®è£

## ãã¡ã¤ã«æ§æ

```
repository
  âââ .circleci
  â      âââ config.yml
  âââ node_modules
  âââ src
  âââ package.json
```

## ã·ã³ãã«ãµã³ãã«

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

`jobs`ã«å®éã«å©ãããã³ãã³ããè¨è¿°ãã
`workflows`ã§å®è¡ãã`jobs`ã®é çªãå¶å¾¡ãã¦ãã¾ãã

ä¸è¨ã³ã¼ãã¯`lint`,`build`ã®ã³ãã³ãã `docker image` ä¸ã§å®è¡ããã³ã¼ãã«ãªãã¾ãã
`run`ã«è¨è¿°ããã³ãã³ããå©ãã®ã«`checkout`ã§å®è¡ç°å¢ã®ä¸­ã¸å¥ãå¿è¦ãããã¾ãã

## å®æå½¢ãµã³ãã«

å®åã§ã¯ä¸è¨ã®ãããªã¤ã¡ã¼ã¸ã§æ¸ããã¦ãã¾ãã

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

### è¿½å è¦ç´ èª¬æ

- `executors`ï¼ å®è¡ç°å¢ãå¤æ°çã«æ±ããããã«

- `references`ï¼ä»åã§ã¯`node_modules`ã®ã­ã£ãã·ã¥æ¦ç¥ã§ä½¿ç¨
  ããã±ã¼ã¸ã®ã¤ã³ã¹ãã¼ã«ã¯ `job`æ¯ã«å¿è¦ãªã®ã§ã `npm install` ãæ¯åå©ãã¦ããããªããã°ãªããªãã â å®è¡æéè¾ã â ãããã­ã£ãã·ã¥ãã¦ãã¾ãã

- `requires`ï¼æå®ãã`job`ã®çµæãè¿ã£ã¦ããæ®µéã§å®è¡ããã¾ããawait ã¿ãããªãã¤ã§ãã

- `store_test_results`,`store_artifacts`ï¼ãã¹ãã®çµæã CircleCI ç®¡çç»é¢ä¸ã§ç¢ºèªããã§ãã¾ãã

# ãã£ã¨æ¬é¡ã Monorepo ã§ã® CircleCI å®è¡

ï¼ã¤ã®ãã£ã¬ã¯ããªã§è¤æ°ãã­ã¸ã§ã¯ããç®¡çãã¦ããç¶æ
ãã®ç®¡çç¶æã âã¢ããªãã¸ããªâ ã¨å¼ã³ã¾ãã

```
repository
âââ frontend
â     âââ package.json
â     âââ node_modules
â     âââ src
â
ââââ backend
â     âââ package.json
â     âââ node_modules
â     âââ src
```

CircleCI ã¯è¨­å®ãã¡ã¤ã«ã root ã«ç½®ãå¿è¦ãããã®ã§ãéå¸¸ã®ä½¿ãæ¹ã§ã¯ã¢ããªãã«å¯¾å¿ã§ãã¾ããã

ããã§ãã¡ããä½¿ç¨ãã¾ãã
https://github.com/labs42io/circleci-monorepo
ã³ã¼ãå¤æ´ããã£ããã­ã¸ã§ã¯ãã®`job`ã®ã¿ãå®è¡ãããããã«ãªããã¢ããªãã§ã® CircleCI å®è¡ãå¯è½ã«ãã¾ãã
å¤æ´æ¤ç¥ã¯`circle_trigger.sh`ã®ä¸­ã§è¡ãããã³ãããããã·ã¥å¤ã§å¤æ­ãã¦ããããã§ãã

# å®è£ãµã³ãã«

https://github.com/taiga248/monorepo

```yml:config.yml
version: 2.1

parameters:
  # å¤æ´æ¤ç¥ãã©ã°
  trigger:
    type: boolean
    default: true
  # åãã­ã¸ã§ã¯ãåã®ãã©ã°ãç¨æãã
  demo:
    type: boolean
    default: false
  sample:
    type: boolean
    default: false

# å®è¡ç°å¢
executors:
  node:
    docker:
      - image: circleci/node:10.15.3

jobs:
  # å·®åæ¤ç¥ç¨ã·ã§ã«å®è¡
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

  # å¤æ´æ¤ç¥ããããã­ã¸ã§ã¯ãã®jobãèµ°ã
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

å®éã«å¤æ´ãå ããpush ãã¦ã¿ã¾ãããã
å·®åãæ¤ç¥ããããã­ã¸ã§ã¯ãã® CI ãèµ°ãã®ãç¢ºèªã§ãããã¨ãã¨æãã¾ãã
![](https://user-images.githubusercontent.com/38455912/153040471-fa43b5d2-51d2-4607-8cef-ac5df40dd47a.png)

# ãã¾ã

## config ãã¡ã¤ã«ã®ããªãã¼ã·ã§ã³ãã§ãã¯

yml ãã¡ã¤ã«ã®æ§æãééã£ã¦ããªããã push ãã¦ CircleCI ä¸ã§ç¢ºèªããã®ã¯é¢åãªã®ã§ã³ãã³ãã§ç¢ºèªããããã«ãã¾ãããã
`$ circleci config validate`
