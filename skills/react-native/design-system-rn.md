---
name: design-system-rn
description: Apply the project's design system when building or editing UI components and screens in RN (Expo). Use when creating new screens, components, or styles — ensures colors, typography, spacing, shadows, gradients, and reusable components are always used consistently from their token files.
---

# Design System — RN (Expo) Banco Premium

## Goal

Every UI file in this project must reference **tokens** (Colors, Fonts, Spacings, BorderRadius, Shadows) and **shared components** (GradientView, PrimaryButton, AppTextInput) instead of raw values. This skill describes the complete token inventory, the available component library, and the rules for using them.

## Lint + Prettier compliance (mandatory)

- Respect existing formatting config: `.prettierrc` + `.prettierignore`.
- Respect existing lint config: `eslint.config.js` with `eslint-config-prettier` enabled.
- Before delivering UI work, run:
  - `npm run lint`
  - `npm run format:check`
- Do not introduce style rules that conflict with Prettier output.

---

## Token files (source of truth)

| File                            | Export                   | Usage                          |
| ------------------------------- | ------------------------ | ------------------------------ |
| `src/ui/styles/Colors.ts`       | `Colors` (default)       | All color values               |
| `src/ui/styles/Fonts.ts`        | `Fonts` (default)        | All typography                 |
| `src/ui/styles/Spacings.ts`     | `Spacings` (default)     | All spacing/gap/padding values |
| `src/ui/styles/BorderRadius.ts` | `BorderRadius` (default) | All corner radii               |
| `src/ui/styles/Shadows.ts`      | `Shadows` (default)      | All shadow objects             |
| `src/ui/styles/FontsScale.ts`   | `ms` (named)             | Scaled font sizes              |
| `src/ui/utils/colorUtils.ts`    | `hexToRgba` (named)      | Hex → rgba strings             |

---

## Colors

**Namespace:** `Colors.base` (aliased as `Colors.bank` for backwards compatibility — always prefer `Colors.base` in new code).

```ts
import Colors from '@/ui/styles/Colors';

// Prefer Colors.base in new code
Colors.base.bgPrimary; // '#0A1628'   — screen background
Colors.base.bgGradientEnd; // '#1A2F5E'   — header gradient end
Colors.base.bgCard; // rgba(255,255,255,0.03)
Colors.base.bgSearchBar; // rgba(255,255,255,0.07)
Colors.base.bgSearchBarBorder; // rgba(255,255,255,0.09)
Colors.base.bgInfoCard; // rgba(255,255,255,0.04)

Colors.base.accent; // '#2D7EF8'   — primary actions / active states
Colors.base.accentGradientStart; // '#3D8EF8'
Colors.base.accentGradientEnd; // '#1A6FE8'
Colors.base.accentDim; // rgba(45,126,248,0.12) — dimmed accent bg
Colors.base.accentDimBorder; // rgba(45,126,248,0.31) — dimmed accent border

Colors.base.cardBorder; // rgba(255,255,255,0.10)
Colors.base.separator; // rgba(255,255,255,0.05)

Colors.base.textPrimary; // '#FFFFFF'
Colors.base.textSecondary; // rgba(255,255,255,0.60)
Colors.base.textMuted; // rgba(255,255,255,0.31)
Colors.base.iconMuted; // rgba(255,255,255,0.38)
Colors.base.badgeEmpty; // rgba(255,255,255,0.08)

// Product icon colors
Colors.base.iconSavings; // '#2D7EF8'
Colors.base.iconCredit; // '#9B59B6'
Colors.base.iconLoan; // '#27AE60'
Colors.base.iconInsurance; // '#E8A030'

// Other namespaces
Colors.alerts.error; // '#E74446'
Colors.alerts.warning; // '#FF8740'
Colors.alerts.check; // '#4eaf0d'
Colors.semantic.text.primaryDark; // '#1C1C1E' — light theme text
Colors.semantic.text.primaryLight; // '#FFFFFF'
```

### Rule: never write raw `rgba()` strings

Use the `hexToRgba` helper when a new translucent color is needed:

```ts
import { hexToRgba } from '@/ui/utils/colorUtils';

hexToRgba('#2D7EF8', 0.2); // 'rgba(45,126,248,0.2)'
hexToRgba('#FFFFFF', 0.08); // 'rgba(255,255,255,0.08)'
```

If the result is reused in multiple components, add it to `Colors.base` in `Colors.ts` first.

---

## Typography

**Always spread a `Fonts` token, then override only `color` (and `fontSize` if strictly needed).**

```ts
import Fonts from '@/ui/styles/Fonts';
import Colors from '@/ui/styles/Colors';

// ✅ Correct
label: {
  ...Fonts.header3,
  color: Colors.base.textPrimary,
},

// ❌ Wrong — raw fontFamily/fontWeight inline
label: {
  fontSize: 22,
  fontFamily: 'Inter-SemiBold',
  fontWeight: '600',
  color: '#FFFFFF',
},
```

### Token → spec table

| Token                   | fontFamily     | fontSize    | Use case                           |
| ----------------------- | -------------- | ----------- | ---------------------------------- |
| `Fonts.bigHeader`       | Inter-Bold     | ms(25, 0.2) | Hero numbers                       |
| `Fonts.header1`         | Inter-Bold     | ms(30)      | Page titles                        |
| `Fonts.header2`         | Inter-Bold     | ms(26)      | Section titles                     |
| `Fonts.header3`         | Inter-SemiBold | ms(22)      | Card headers, logo text            |
| `Fonts.header4`         | Inter-Medium   | ms(22)      | Secondary headers                  |
| `Fonts.header5`         | Inter-Medium   | ms(18)      | Empty state titles, labels         |
| `Fonts.bodyText`        | Inter-Regular  | ms(15)      | Body copy                          |
| `Fonts.bodyTextBold`    | Inter-SemiBold | ms(15)      | Emphasized body, card names        |
| `Fonts.smallBodyText`   | Inter-Regular  | ms(13)      | Descriptions, subtitles            |
| `Fonts.inputsBold`      | Inter-SemiBold | ms(17)      | Nav titles                         |
| `Fonts.inputsNormal`    | Inter-Regular  | ms(15)      | Text inputs                        |
| `Fonts.callToActions`   | Inter-SemiBold | ms(18)      | Button labels (large)              |
| `Fonts.links`           | Inter-Medium   | ms(12)      | Badges, small labels, links        |
| `Fonts.bigNumbers`      | Inter-Bold     | ms(50, 0.2) | Stats, amounts                     |
| `Fonts.bigNumbersLight` | Inter-Regular  | ms(50, 0.2) | Light stats                        |
| `Fonts.labelInputError` | Inter-Regular  | ms(12)      | Error messages (color already set) |

### Rule: `fontWeight` is never set inline

All `fontWeight` is baked into the `fontFamily` name (`Inter-Bold`, `Inter-SemiBold`, `Inter-Medium`, `Inter-Regular`). Spreading a `Fonts` token handles it automatically.

---

## Spacing

```ts
import Spacings from '@/ui/styles/Spacings';

Spacings.xs; // 4
Spacings.sm; // 8
Spacings.md; // 12
Spacings.lg; // 16
Spacings.xl; // 24
Spacings.xxl; // 32
Spacings.spacex2; // 20  (horizontal screen padding)
Spacings.spacex6; // 48
Spacings.spacex7; // 64
```

Use arithmetic only for minor tweaks (`Spacings.sm + 2`). For new recurring values ask yourself: should this be added to `Spacings.ts`?

---

## Border Radius

```ts
import BorderRadius from '@/ui/styles/BorderRadius';

BorderRadius.xs; // 4
BorderRadius.sm; // 8
BorderRadius.md; // 12  — default cards
BorderRadius.lg; // 16  — form cards
BorderRadius.xl; // 20
BorderRadius.xxl; // 30
BorderRadius.pill; // 100 — buttons, avatars
```

---

## Shadows

```ts
import Shadows from '@/ui/styles/Shadows';

Shadows.bankCard; // for product cards (dark shadow)
Shadows.bankButton; // for primary buttons (blue glow)
```

Spread directly into a `StyleSheet` object: `...Shadows.bankCard`.

---

## Reusable components

### `GradientView`

**Path:** `@/ui/components/GradientView`

A `LinearGradient` wrapper with design-system presets.

```tsx
import GradientView from '@/ui/components/GradientView';

// Preset — header/nav background
<GradientView preset="header" style={styles.header}>…</GradientView>

// Preset — primary CTA fill
<GradientView preset="accent" style={styles.button}>…</GradientView>

// Custom gradient (icon containers, decorative elements)
<GradientView colors={['#9B59B6', '#2D7EF8']} style={styles.icon}>…</GradientView>

// Horizontal direction
<GradientView preset="accent" direction="horizontal" style={styles.bar} />
```

**Rule:** Never use `<LinearGradient>` directly. Always use `<GradientView>`.

---

### `PrimaryButton`

**Path:** `@/ui/components/PrimaryButton`

The only gradient CTA button in the app.

```tsx
import PrimaryButton from '@/ui/components/PrimaryButton';

<PrimaryButton label="Agregar" iconName="add" onPress={handleAdd} />
<PrimaryButton label="Guardar" onPress={handleSave} loading={vm.saving} />
<PrimaryButton label="Confirmar" onPress={handleConfirm} disabled={!vm.isValid} />
<PrimaryButton label="Registrar" onPress={handleRegister} style={{ marginTop: 16 }} />
```

Props: `label`, `onPress`, `iconName?` (Ionicons key), `loading?`, `disabled?`, `style?` (wrapper override).

**Rule:** Never build a custom `TouchableOpacity + LinearGradient` button. Use `PrimaryButton`.

---

### `AppTextInput`

**Path:** `@/ui/components/AppTextInput`

All text inputs in the app. Two variants:

```tsx
import AppTextInput from '@/ui/components/AppTextInput';

// Default — form field with label and optional inline error
<AppTextInput
  label="Nombre del producto"
  placeholder="ej. Cuenta de Ahorros"
  value={vm.name}
  onChangeText={vm.setName}
  error={vm.nameError}
/>

// Search — pill shape, auto leading search icon
<AppTextInput
  variant="search"
  placeholder="Buscar producto..."
  value={vm.query}
  onChangeText={vm.setQuery}
/>

// Custom leading icon
<AppTextInput
  label="Correo"
  leadingIcon="mail-outline"
  value={vm.email}
  onChangeText={vm.setEmail}
  keyboardType="email-address"
/>
```

All `TextInputProps` are forwarded via spread. The `style` prop is intentionally omitted (variant controls layout).

**Rule:** Never use `<TextInput>` directly inside screens or components. Always use `<AppTextInput>`.

---

## Screen layout conventions

### SafeAreaView

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
  {/* screen content */}
</SafeAreaView>;
```

`safeArea.backgroundColor` always = `Colors.base.bgPrimary`.

### Header / Nav bar

```tsx
<GradientView preset="header" style={styles.header}>
  {/* back button, title, right action */}
</GradientView>
```

`header` height: 96 (add form) or 120 (list screens). Top padding: `Spacings.spacex6` (48) to clear status bar.

### Card containers

```ts
cardContainer: {
  padding: Spacings.md,
  backgroundColor: Colors.base.bgCard,
  borderRadius: BorderRadius.md,   // 12 for small, BorderRadius.lg for form cards
  borderWidth: 1,
  borderColor: Colors.base.cardBorder,
  ...Shadows.bankCard,
},
```

### Style property ordering (enforce in all StyleSheet objects)

1. `padding` / `margin`
2. `position` / `display` / `flex` / layout props
3. `width` / `height`
4. `fontWeight` ← only via `...Fonts.token`
5. `color`
6. `backgroundColor`
7. `fontSize` ← only `ms()` values
8. `fontFamily` ← only via spread, never inline
9. `borderRadius` / `borderWidth` / `borderColor`

---

## Rules checklist (apply to every new file)

- [ ] No raw `rgba()` strings — use `hexToRgba` or `Colors.base.*`
- [ ] No raw hex colors outside `Colors.ts` — add to palette first
- [ ] No inline `fontFamily` or `fontWeight` — always `...Fonts.[token]`
- [ ] No `fontSize` without `ms()` scaling
- [ ] No direct `LinearGradient` — use `GradientView`
- [ ] No direct `TouchableOpacity + gradient` buttons — use `PrimaryButton`
- [ ] No direct `TextInput` — use `AppTextInput`
- [ ] Spacing values from `Spacings.*`, radii from `BorderRadius.*`
- [ ] Shadows from `Shadows.*` spread into StyleSheet
- [ ] Style property order matches the block above
