# 使用方法

Material Symbols SVGライブラリの使用方法を説明します。

## インストール

### React用パッケージ
```bash
# Outlined / Rounded / Sharp（単一パッケージ）
npm install @material-symbols-svg/react
```

### Vue用パッケージ
```bash
# Outlined / Rounded / Sharp（単一パッケージ）
npm install @material-symbols-svg/vue
```

### メタデータパッケージ
```bash
# アイコンメタデータとパスデータ
npm install @material-symbols-svg/metadata
```

## 基本的な使用方法

### React

#### 1. ウェイト毎のインポート（推奨）
```tsx
import { Home, Settings, Search } from '@material-symbols-svg/react/w400';
import { Home as HomeRounded } from '@material-symbols-svg/react/rounded/w400';

function App() {
  return (
    <div>
      <Home size={24} />
      <Settings size={32} color="blue" />
      <Search size={48} className="search-icon" />
      <HomeRounded size={24} />
    </div>
  );
}
```

#### 2. デフォルト（w400）インポート
```tsx
import { Home, Settings, Search } from '@material-symbols-svg/react';

function App() {
  return (
    <div>
      <Home size={24} />
      <Settings size={32} color="blue" />
      <Search size={48} className="search-icon" />
    </div>
  );
}
```

#### 3. 個別アイコンインポート
```tsx
import Home from '@material-symbols-svg/react/icons/home';
import Settings from '@material-symbols-svg/react/icons/settings';

function App() {
  return (
    <div>
      <Home size={24} />
      <Settings size={32} color="blue" />
    </div>
  );
}
```

### Vue

#### 1. ウェイト毎のインポート（推奨）
```vue
<template>
  <div>
    <Home :size="24" />
    <Settings :size="32" color="blue" />
    <Search :size="48" class="search-icon" />
    <HomeRounded :size="24" />
  </div>
</template>

<script setup>
import { Home, Settings, Search } from '@material-symbols-svg/vue/w400';
import { Home as HomeRounded } from '@material-symbols-svg/vue/rounded/w400';
</script>
```

#### 2. デフォルト（w400）インポート
```vue
<template>
  <div>
    <Home :size="24" />
    <Settings :size="32" color="blue" />
    <Search :size="48" class="search-icon" />
  </div>
</template>

<script setup>
import { Home, Settings, Search } from '@material-symbols-svg/vue';
</script>
```

#### 3. 個別アイコンインポート
```vue
<template>
  <div>
    <Home :size="24" />
    <Settings :size="32" color="blue" />
  </div>
</template>

<script setup>
import Home from '@material-symbols-svg/vue/icons/home';
import Settings from '@material-symbols-svg/vue/icons/settings';
</script>
```

## プロパティ

### 共通プロパティ

#### size
アイコンのサイズを指定します。
- **型**: `number | string`
- **デフォルト**: `24`
- **単位**: px

```tsx
<Home size={16} />    // 16px
<Home size={24} />    // 24px（デフォルト）
<Home size={32} />    // 32px
<Home size="2rem" />  // 2rem
```

#### color
アイコンの色を指定します。
- **型**: `string`
- **デフォルト**: `"currentColor"`

```tsx
<Home color="red" />
<Home color="#333" />
<Home color="rgb(255, 0, 0)" />
<Home color="var(--primary-color)" />
```

#### className / class
CSSクラスを追加します。
- **型**: `string`

```tsx
// React
<Home className="my-icon" />
<Home className="icon-large text-blue" />

// Vue
<Home class="my-icon" />
<Home class="icon-large text-blue" />
```

### フレームワーク固有のプロパティ

#### React
```tsx
// すべてのSVG属性をサポート
<Home 
  size={24} 
  color="blue"
  className="my-icon"
  onClick={() => console.log('clicked')}
  style={{ margin: '10px' }}
  aria-label="ホーム"
/>
```

#### Vue
```vue
<template>
  <Home 
    :size="24" 
    color="blue"
    class="my-icon"
    @click="handleClick"
    :style="{ margin: '10px' }"
    aria-label="ホーム"
  />
</template>
```

## ウェイト（太さ）の使い分け

Material Symbolsは7つのウェイト（太さ）をサポートしています：

```tsx
import { Home } from '@material-symbols-svg/react/w100'; // 最も細い
import { Home } from '@material-symbols-svg/react/w200';
import { Home } from '@material-symbols-svg/react/w300';
import { Home } from '@material-symbols-svg/react/w400'; // 標準
import { Home } from '@material-symbols-svg/react/w500';
import { Home } from '@material-symbols-svg/react/w600';
import { Home } from '@material-symbols-svg/react/w700'; // 最も太い
```

### 使用場面の例
- **w100-w300**: 小さなアイコンや繊細なUI
- **w400**: 標準的な使用（デフォルト）
- **w500-w700**: 大きなアイコンや強調したい場合

## スタイルの使い分け

### Outlined（デフォルト）
```tsx
import { Home } from '@material-symbols-svg/react';
```
- 線画スタイル
- 最も汎用的で軽量

### Rounded
```tsx
import { Home } from '@material-symbols-svg/react/rounded';
```
- 角が丸いスタイル
- 親しみやすく柔らかい印象

### Sharp
```tsx
import { Home } from '@material-symbols-svg/react/sharp';
```
- シャープで角張ったスタイル
- 現代的でクリーンな印象

## アイコン名の確認

### アイコンの探し方
1. **Material Symbols公式サイト**: https://fonts.google.com/icons
2. **検索機能**: 公式サイトの検索で日本語や英語で検索
3. **カテゴリ**: action, av, communication, device, etc.

### アイコン名のルール
- **命名規則**: `snake_case`（例: `arrow_forward`, `add_circle`）
- **数字始まり**: `Icon`プレフィックス（例: `3d_rotation` → `Icon3dRotation`）
- **コンポーネント名**: `PascalCase`（例: `ArrowForward`, `AddCircle`）

## メタデータの活用

### アイコン情報の取得
```typescript
import iconIndex from '@material-symbols-svg/metadata/icon-index.json';

// アイコンの詳細情報を取得
const homeIcon = iconIndex.home;
console.log(homeIcon.categories); // ['action']
console.log(homeIcon.version); // 20240329
```

### 検索用語の活用
```typescript
import searchTerms from '@material-symbols-svg/metadata/search-terms.json';

// 検索機能の実装
const searchIcon = (query: string) => {
  return Object.entries(searchTerms).filter(([name, terms]) => 
    terms.some(term => term.toLowerCase().includes(query.toLowerCase()))
  );
};

// 使用例
const results = searchIcon('house'); // 'home'アイコンが見つかる
```

## パフォーマンス最適化

### Tree-shaking
使用しないアイコンはバンドルに含まれません：

```tsx
// ✅ 良い例：必要なアイコンのみインポート
import { Home, Settings } from '@material-symbols-svg/react/w400';

// ❌ 避けるべき：全アイコンのインポート
import * as Icons from '@material-symbols-svg/react/w400';
```

### 動的インポート
大量のアイコンを使用する場合：

```tsx
// 動的インポート
const loadIcon = async (iconName: string) => {
  const module = await import(`@material-symbols-svg/react/icons/${iconName}`);
  return module.default;
};

// 使用例
const HomeIcon = await loadIcon('home');
```

### バンドルサイズの最適化
```tsx
// ✅ 個別インポート（推奨）
import Home from '@material-symbols-svg/react/icons/home';

// ✅ ウェイト別インポート
import { Home, Settings } from '@material-symbols-svg/react/w400';

// ❌ 避けるべき：デフォルトインポート（やや重い）
import { Home, Settings } from '@material-symbols-svg/react';
```

## スタイリング

### CSS変数の活用
```css
:root {
  --icon-size: 24px;
  --icon-color: #333;
}

.my-icon {
  width: var(--icon-size);
  height: var(--icon-size);
  fill: var(--icon-color);
}
```

### CSS-in-JSの例
```tsx
const iconStyles = {
  width: '24px',
  height: '24px',
  fill: 'currentColor',
  transition: 'fill 0.2s ease'
};

<Home style={iconStyles} />
```

### Tailwind CSSの例
```tsx
<Home className="w-6 h-6 text-blue-500 hover:text-blue-700" />
```

## アクセシビリティ

### ARIA属性の追加
```tsx
<Home 
  aria-label="ホーム" 
  role="img"
  aria-hidden="false"
/>

// 装飾的なアイコンの場合
<Home aria-hidden="true" />
```

### セマンティックな使用
```tsx
// ボタンの中で使用
<button aria-label="ホームに戻る">
  <Home aria-hidden="true" />
  ホーム
</button>

// リンクの中で使用
<a href="/" aria-label="ホームページ">
  <Home aria-hidden="true" />
</a>
```

## 実践的な例

### ナビゲーション
```tsx
import { Home, Settings, Person, Search } from '@material-symbols-svg/react/w400';

const Navigation = () => (
  <nav>
    <a href="/"><Home size={24} /> ホーム</a>
    <a href="/search"><Search size={24} /> 検索</a>
    <a href="/profile"><Person size={24} /> プロフィール</a>
    <a href="/settings"><Settings size={24} /> 設定</a>
  </nav>
);
```

### アクションボタン
```tsx
import { Add, Edit, Delete } from '@material-symbols-svg/react/w500';

const ActionButtons = () => (
  <div>
    <button><Add size={20} /> 追加</button>
    <button><Edit size={20} /> 編集</button>
    <button><Delete size={20} /> 削除</button>
  </div>
);
```

### 状態表示
```tsx
import { CheckCircle, Error, Warning } from '@material-symbols-svg/react/w400';

const StatusIcon = ({ status }: { status: 'success' | 'error' | 'warning' }) => {
  const icons = {
    success: <CheckCircle color="green" />,
    error: <Error color="red" />,
    warning: <Warning color="orange" />
  };
  
  return icons[status];
};
```
