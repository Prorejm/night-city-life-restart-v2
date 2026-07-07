# 夜城重启 — 赛博朋克美国生存重开模拟器

> **"欢迎来到夜之城。在这里，你唯一的出路就是——再活一次。"**

---

## 截图预览

```
┌────────────────────────────────────────────┐
│   █████╗  ██╗   ██╗     ██████╗ ██╗████████╗██╗   ██╗
│  ██╔══██╗ ╚██╗ ██╔╝    ██╔════╝ ██║╚══██╔══╝╚██╗ ██╔╝
│  ███████║  ╚████╔╝     ██║      ██║   ██║    ╚████╔╝
│  ██╔══██║   ╚██╔╝      ██║      ██║   ██║     ╚██╔╝
│  ██║  ██║    ██║       ╚██████╗ ██║   ██║      ██║
│  ╚═╝  ╚═╝    ╚═╝        ╚═════╝ ╚═╝   ╚═╝      ╚═╝
│                    生存 · 挣扎 · 死亡 · 重生
└────────────────────────────────────────────┘
```

> *赛博朋克风格终端界面，CRT扫描线效果，霓虹故障动画*

---

## 游戏简介

**夜城重启** 是一款基于浏览器运行的赛博朋克主题文字生存模拟游戏。玩家将扮演夜之城的一名底层居民，从出生开始面对残酷的都市丛林——在街头挣扎求生，在利益的漩涡中做出抉择，在各种致命的危险中设法活下去。当你不可避免地死去，你还将带着前世的记忆与天赋，**重开** 新一轮的人生。

游戏融合了 **赛博朋克红 / 赛博朋克2020 / 都市异景** 三套规则书的核心机制，同时参考了多部非虚构社会调查著作构建了现实而残酷的生存系统。

---

## 游戏特色

### 基于赛博朋克规则书的核心系统

游戏底层逻辑深度参考了《赛博朋克红》《赛博朋克2020》以及《都市异景》的规则设计，包括属性检定、技能判定、伤害计算、赛博义体容量等核心机制，力求还原桌游般的硬核体验。

### 5 维核心属性系统 + 对数成长曲线

玩家拥有 **体能、智力、反应、魅力、意志** 五项核心属性，采用对数成长曲线模型——越高的等级需要越多的经验，避免数值膨胀的同时让每次升级都充满意义。

### 10 种死亡类型 + 死亡链系统

游戏包含 **暴力致死、药物过量、疾病、冻死街头、被驱逐后死亡、赛博精神病、经济崩溃、孤独死、绝望自尽、随机意外** 等 10 种死亡类型，每种死亡有独特的触发条件与叙事文本。死亡链系统将记录你的每一次死亡，并影响下一次重开。

### 阿片类药物成瘾系统（基于《梦瘾》）

基于《梦瘾：美国的阿片类药物危机》一书构建的药物系统，包含多种合法与非法药物。玩家使用药物可获得短期增益，但会累积成瘾度，长期使用将导致戒断反应、属性下降甚至过量致死。

### 住房驱逐系统（基于《扫地出门》）

参考《扫地出门：美国城市的贫穷与暴利》中的田野调查数据，模拟了从合租屋到街头流浪的完整住房阶梯。租金压力、房东驱逐、房屋条件恶化等机制让玩家切身感受住房不稳定的生存焦虑。

### 医疗保障系统（基于《美国底层》）

基于《美国底层：一个国家的溃败》中的真实案例，构建了分层的医疗体系。无保险玩家只能依赖廉价诊所和民间偏方，而有保险也未必能获得及时救治。医疗账单是导致破产的主要原因之一。

### 60+ 天赋系统 + 重开继承机制

超过 60 种天赋，涵盖 **社会背景、身体特质、精神特质、赛博改造、命运眷顾** 五大类别。每次死亡后重开，可继承部分前代天赋，形成独特的角色传承叙事。

### 100+ 随机事件覆盖人生全程

从出生到死亡，覆盖 **婴儿期、少年期、青年期、成年期、老年期** 全生命阶段。每个阶段有专属事件池，加上街头事件、医疗事件、住房事件、药物事件等，总计超过 100 个随机事件，确保每次游玩都有新鲜感。

### 赛博义体改造系统

前往义体诊所升级你的身体——强化义眼、皮下护甲、反应加速器、神经处理器……每种义体都有属性增益和潜在副作用，赛博化程度过高将触发赛博精神病检定。

### 赛博朋克风格 UI（CRT / 霓虹 / 故障效果）

- CRT 扫描线叠加层
- 霓虹发光边框与文字阴影
- 故障/毛刺文本动画
- 数据雨特效
- 暗色主题 + 青色/品红/黄色霓虹配色方案
- 终端风格日志系统

---

## 技术栈

| 技术 | 用途 |
|------|------|
| **React 18** | UI 框架 |
| **TypeScript** | 类型安全 |
| **Vite** | 构建工具 |
| **Tailwind CSS** | 样式系统 |
| **shadcn/ui** | 组件库 |
| **Zustand** | 状态管理 |
| **Lucide React** | 图标库 |
| **Sonner** | 通知系统 |
| **next-themes** | 主题管理 |

---

## 本地开发指南

### 环境要求

- **Node.js** >= 18.x（推荐 20.x）
- **npm** >= 9.x

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/Prorejm/night-city-life-restart-v2.git
cd night-city-life-restart-v2

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 浏览器打开 http://localhost:5173
```

### 构建部署

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

构建产物位于 `dist/` 目录，可直接部署至 GitHub Pages、Netlify 或 Vercel。

---

## 模块化说明

### 数据结构

所有游戏数据以 JSON 文件形式存放在 `data/` 目录下，便于扩展和维护：

```
data/
├── events/          # 随机事件数据（按生命阶段分类）
│   ├── events-birth.json
│   ├── events-teen.json
│   ├── events-adult.json
│   ├── events-street.json
│   ├── events-drug.json
│   ├── events-housing.json
│   ├── events-medical.json
│   └── events-death.json
├── talents.json     # 天赋数据
├── drugs.json       # 药物数据
├── housing.json     # 住房数据
├── cyberware.json   # 赛博义体数据
└── achievements.json # 成就数据
```

### 如何添加新事件

在 `data/events/` 下对应的 JSON 文件中添加新条目：

```json
{
  "id": "event_unique_id",
  "title": "事件标题",
  "description": "事件描述文本",
  "choices": [
    {
      "text": "选项 A",
      "effects": { "hp": -10, "money": 50 },
      "log": "结果描述文本"
    },
    {
      "text": "选项 B",
      "effects": { "intelligence": 1, "stress": 20 },
      "log": "结果描述文本"
    }
  ],
  "tags": ["street", "random"]
}
```

### 如何添加新天赋

在 `data/talents.json` 中添加：

```json
{
  "id": "talent_unique_id",
  "name": "天赋名称",
  "description": "天赋描述",
  "category": "body|mind|social|cyber|fate",
  "effects": { "strength": 2 },
  "cost": 1,
  "exclusive_group": null,
  "prerequisites": [],
  "inheritable": true,
  "rarity": "common|uncommon|rare|legendary"
}
```

### 核心引擎模块

游戏逻辑采用分层架构：

| 模块 | 功能 |
|------|------|
| `src/core/GameEngine.ts` | 主游戏循环 |
| `src/core/EventSystem.ts` | 事件触发与处理 |
| `src/core/TalentSystem.ts` | 天赋管理与生效 |
| `src/core/DeathSystem.ts` | 死亡类型判定与死亡链 |
| `src/core/DrugSystem.ts` | 药物使用与成瘾 |
| `src/core/HousingSystem.ts` | 住房状态管理 |
| `src/core/HealthSystem.ts` | 健康与医疗 |
| `src/core/PropertySystem.ts` | 属性成长与对数曲线 |
| `src/core/RebirthSystem.ts` | 重生继承机制 |
| `src/core/LevelCurve.ts` | 对数成长曲线计算 |
| `src/engine/` | 通用引擎工具（随机数、公式、条件评估、状态管理） |

---

## 数据来源标注

本游戏的部分系统设计参考了以下著作与规则书：

1. **赛博朋克规则书**
   - 《赛博朋克红》（Cyberpunk RED）— R. Talsorian Games
   - 《赛博朋克2020》（Cyberpunk 2020）— R. Talsorian Games
   - 《都市异景》（The Urban Fantasy）— 第三方扩展规则

2. **非虚构社会调查**
   - 《梦瘾：美国的阿片类药物危机》（Dreamland）— Sam Quinones
   - 《扫地出门：美国城市的贫穷与暴利》（Evicted）— Matthew Desmond
   - 《美国底层：一个国家的溃败》（The Unwinding / Hillbilly Elegy 等综合参考）

3. **赛博朋克文化**
   - 《仿生人会梦见电子羊吗？》— Philip K. Dick
   - 《神经漫游者》— William Gibson
   - 《银翼杀手》《赛博朋克：边缘行者》等影视作品

> **免责声明**：本游戏为同人创作项目，所有参考规则书及著作的知识产权归原作者所有。游戏内数据为艺术创作，不代表真实医疗或社会建议。

---

## 许可证

本项目采用 **MIT License** 开源。

```
MIT License

Copyright (c) 2024 Night City Life Restart Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 贡献

欢迎提交 Issue 和 Pull Request。如果你发现了 Bug 或有新功能建议，请在 GitHub 仓库中创建 Issue。

---

**在夜之城，你不是在生活——你只是在等下一次重开。**

[返回顶部](#夜城重启--赛博朋克美国生存重开模拟器)
