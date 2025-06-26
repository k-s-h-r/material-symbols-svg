/**
 * 開発時に使用するアイコンリストの一元管理
 * 通常版とFillバージョンの両方を自動生成
 */

// 基本アイコンリスト（よく使われるアイコン）
const BASE_ICONS = [
  'Home',
  'Settings', 
  'Star',
  'Favorite',
  'Person',
  'Search',
  'Menu',
  'Close',
  'Check',
  'ArrowForward' 
];

/**
 * PascalCase名からkebab-case/snake_caseに変換
 */
function toKebabCase(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function toSnakeCase(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

/**
 * 各スクリプト用のアイコンリストを生成
 */

// generate-dynamic-icons.cjs用（PascalCase）
export function getPascalCaseIcons() {
  const fillIcons = BASE_ICONS.map(icon => `${icon}Fill`);
  return [...BASE_ICONS, ...fillIcons];
}

// generate-icons.cjs用（kebab-case & snake_case）
export function getKebabSnakeCaseIcons() {
  const kebabIcons = BASE_ICONS.map(toKebabCase);
  const snakeIcons = BASE_ICONS.map(toSnakeCase);
  
  // Fillバージョン（Material Symbolsは-fillサフィックス）
  const fillKebabIcons = BASE_ICONS.map(icon => `${toKebabCase(icon)}-fill`);
  const fillSnakeIcons = BASE_ICONS.map(icon => `${toSnakeCase(icon)}-fill`);
  
  // kebab-caseとsnake_caseを混在（Material Symbolsの実際の命名に対応）
  return [
    ...kebabIcons.filter(icon => icon !== 'arrow-forward'), // arrow-forwardは除外
    'arrow_forward', // snake_caseで追加
    ...fillKebabIcons.filter(icon => icon !== 'arrow-forward-fill'), // arrow-forward-fillは除外  
    'arrow_forward-fill' // snake_caseベース + -fillで追加
  ];
}

// rollup.config.js用（PascalCase）
export function getRollupIcons() {
  const fillIcons = BASE_ICONS.map(icon => `${icon}Fill`);
  return [...BASE_ICONS, ...fillIcons];
}

// rollup.config.js用（kebab-caseファイル名）
export function getRollupKebabFileNames() {
  const fillIcons = BASE_ICONS.map(icon => `${icon}Fill`);
  const allIcons = [...BASE_ICONS, ...fillIcons];
  return allIcons.map(toKebabCase);
}

// 基本アイコンリスト（管理用）
export { BASE_ICONS };