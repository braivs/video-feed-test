# Лента медиа-контента — технический план реализации

Mobile-first веб-страница с вертикальной лентой коротких видео (аналог TikTok / Instagram Reels / YouTube Shorts): пользователь скроллит ленту, активное видео воспроизводится автоматически, следующие элементы подгружаются заранее.

Документ описывает **план реализации**, а не готовый продукт: архитектуру, trade-offs и обоснование решений.

---

## Реализовано в прототипе

Прототип использует реальные MP4-ролики из Cloudflare R2 и нативный `<video>`. В нём уже есть:

- mobile-first fullscreen-лента с CSS Scroll Snap;
- Redux Toolkit для active slide, mute и likes;
- autoplay muted, play/pause по tap, сохранение позиции при возврате к ролику;
- глобальное включение звука, progress bar, loading, error state и Retry;
- preload: active — `auto`, следующий ролик — `metadata`, остальные — `none`;
- pause/resume через Page Visibility API.

Для компактности MVP пока не включает виртуализацию, API pagination, HLS/ABR, отдельный `PreloadManager` и persistent cache. Эти части описаны ниже как production-стратегия.

---

## Содержание

1. [Реализовано в прототипе](#реализовано-в-прототипе)
2. [Цели и критерии успеха](#цели-и-критерии-успеха)
3. [Общая архитектура](#общая-архитектура)
4. [Стек и работа с видео/медиа](#1-стек-и-работа-с-видеомедиа)
5. [Механизм скролла и жестов](#2-механизм-скролла-между-элементами-ленты)
6. [Стратегия предзагрузки](#3-стратегия-предзагрузки-контента)
7. [Управление состоянием](#4-управление-состоянием)
8. [Производительность](#5-производительность)
9. [Отличия от TikTok / Reels / Shorts](#6-что-было-бы-сделано-иначе)
10. [План реализации по этапам](#план-реализации-по-этапам)
11. [Trade-offs](#trade-offs)

---

## Цели и критерии успеха

**Цель:** одна «карточка» видео на весь экран, плавный вертикальный скролл со snap, автоплей активного ролика, предзагрузка следующих элементов без перегрузки сети и устройства.

**Критерии успеха:**

| Метрика | Целевое значение |
|---------|------------------|
| Time to first frame (активный ролик) | ≤ 300–500 ms на 4G |
| Переключение между роликами | без чёрного экрана, poster → video crossfade |
| Быстрый fling-скролл | без зависаний, без гонок play/pause |
| Память | не растёт линейно с длиной ленты |
| Autoplay | стабильный muted autoplay на iOS/Android/desktop |

**Вне scope MVP:** авторизация, комментарии, рекомендательный алгоритм, загрузка UGC, продакшн-аналитика.

---

## Общая архитектура

```mermaid
flowchart TB
    subgraph UI["UI Layer"]
        FeedShell["FeedShell"]
        VirtualList["VirtualizedFeed"]
        Slide["FeedSlide × N"]
        Player["VideoPlayer"]
        Overlay["Overlay UI"]
    end

    subgraph Core["Core Layer"]
        ScrollSnap["Scroll / Snap Controller"]
        Visibility["Visibility / Active Index"]
        Preload["PreloadManager"]
        Playback["PlaybackOrchestrator"]
    end

    subgraph Data["Data Layer"]
        FeedStore["Feed Store"]
        MediaCache["Media Cache (LRU)"]
        API["Feed API"]
    end

    FeedShell --> VirtualList
    VirtualList --> Slide
    Slide --> Player
    Slide --> Overlay

    ScrollSnap --> Visibility
    Visibility --> Playback
    Visibility --> Preload
    Preload --> MediaCache
    FeedStore --> VirtualList
    API --> FeedStore
    Playback --> Player
```

**Ключевой принцип:** один `PlaybackOrchestrator` решает, *какое* видео играет. UI только отображает состояние. Это убирает гонки при быстром скролле, когда несколько компонентов одновременно вызывают `play()` / `pause()`.

**Поток данных при смене слайда:**

```
scroll / snap → IntersectionObserver → activeIndex
    → PlaybackOrchestrator.setActive(id)
    → pause all except active
    → play active (muted)
    → PreloadManager.schedule(+1, +2)
    → dispatch(markViewed(id)) (после порога просмотра)
```

---

## 1. Стек и работа с видео/медиа

### Выбор стека

| Слой | Решение | Обоснование |
|------|---------|-------------|
| Framework | React 19 + TypeScript | Предсказуемый lifecycle, экосystem, удобно для тестового |
| Bundler | Vite | Быстрый dev, простой деплой статики |
| Стили | CSS Modules | Изоляция стилей без лишнего веса |
| Виртуализация | `@tanstack/react-virtual` | Контроль над windowed render длинного списка |
| State | Redux Toolkit | Предсказуемый data flow, DevTools, RTK Query для pagination API |
| Плеер | Нативный `<video>` | Достаточно для short-form, меньше bundle чем Video.js |
| HLS (опционально) | hls.js | Только если API отдаёт adaptive streaming (.m3u8) |

**Почему нативный `<video>`, а не Video.js / Plyr:** для short-form нужны autoplay, mute, loop, poster и preload — это покрывает native API. Полноценный плеер оправдан при DRM, кастомных контролах, рекламных вставках — здесь это overkill.

### Форматы и источники

Приоритет источников на клиенте:

1. **WebM (VP9 / AV1)** — меньше трафика там, где поддерживается
2. **MP4 (H.264)** — fallback для Safari / iOS
3. **HLS** — если ролики длиннее или нужен adaptive bitrate

Ожидаемый контракт API:

```json
{
  "id": "abc123",
  "duration": 12.4,
  "posterUrl": "https://cdn.example.com/posters/abc123.jpg",
  "sources": [
    { "type": "video/webm", "url": "...", "bitrate": 800000 },
    { "type": "video/mp4", "url": "...", "bitrate": 1200000 }
  ],
  "width": 1080,
  "height": 1920
}
```

Выбор bitrate: по `navigator.connection.effectiveType` (если доступно) или medium по умолчанию.

### Политика воспроизведения

```typescript
interface PlaybackPolicy {
  autoplay: true;
  muted: true;        // обязательно для autoplay policy браузеров
  loop: true;
  playsInline: true;  // критично для iOS
  preload: 'none' | 'metadata' | 'auto'; // управляется PreloadManager
}
```

Браузеры разрешают autoplay только без звука. Звук включается явным действием пользователя (tap), выбор запоминается в session.

### Буферизация

| Роль слайда | preload | Действие |
|-------------|---------|----------|
| Активный | `auto` | Цель: `canplaythrough` или 2–3 сек буфера |
| Следующий (+1) | `metadata` + fetch | Prefetch первых MB через HTTP Range |
| Остальные | `none` | Только poster |

**Обработка ошибок:**

- timeout на `loadeddata` (3s) → poster + кнопка Retry (1–2 попытки с backoff);
- `stalled` / `waiting` > 1s → переключение на более низкий bitrate tier;
- autoplay blocked → overlay «Tap to play».

### Псевдокод PlaybackOrchestrator

```typescript
class PlaybackOrchestrator {
  private activeId: string | null = null;

  setActive(id: string) {
    if (this.activeId === id) return;

    for (const [videoId, el] of videoRefs) {
      if (videoId !== id) el.pause();
    }

    this.activeId = id;
    const video = videoRefs.get(id);
    if (!video) return;

    video.muted = store.getState().feed.isMuted;
    video.play().catch(() => store.dispatch(setPlaybackBlocked(true)));
  }

  onIntersection(entries: IntersectionObserverEntry[]) {
    const candidate = entries
      .filter(e => e.intersectionRatio >= 0.6)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (candidate) {
      this.setActive(candidate.target.dataset.videoId!);
    }
  }
}
```

---

## 2. Механизм скролла между элементами ленты

### Подход: CSS Scroll Snap

```css
.feed {
  height: 100dvh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
}

.slide {
  height: 100dvh;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}
```

**Почему scroll snap, а не Swiper.js:**

- нативная инерция и физика скролла;
- accessibility: клавиатура, scroll chaining;
- меньше JS на hot path;
- Swiper оправдан при 3D-эффектах и сложных transition — для TikTok-like ленты избыточен.

`100dvh` вместо `100vh` — dynamic viewport учитывает mobile browser chrome (адресная строка).

### Определение активного слайда

Два complementary механизма:

1. **IntersectionObserver** — элемент с `intersectionRatio ≥ 0.6` становится кандидатом в active.
2. **`scrollend`** (или debounced scroll) — финальный index после остановки скролла.

При быстром fling IO может «дёргаться» между соседними слайдами — `scrollend` финализирует `activeIndex`:

```typescript
container.addEventListener('scrollend', () => {
  const index = Math.round(container.scrollTop / container.clientHeight);
  store.dispatch(setActiveIndex(index));
});
```

### Жесты

| Жест | Поведение |
|------|-----------|
| Vertical swipe / fling | Нативный scroll + snap |
| Tap | Pause / play или показать UI |
| Double tap | Like (опционально) |
| Long press | Pause (опционально) |

**Конфликт жестов:** overlay-кнопки с `pointer-events: auto`, на видео — tap handler без блокировки vertical scroll (`touch-action: pan-y`).

### Fallback для старых браузеров

Если `scroll-snap-stop: always` ведёт себя нестабильно — programmatic snap после жеста:

```typescript
container.scrollTo({
  top: index * container.clientHeight,
  behavior: 'smooth',
});
```

---

## 3. Стратегия предзагрузки контента

### Окно рендера и сети

**DOM (виртуализация):** рендерим `activeIndex - 1` … `activeIndex + 2` → **4 слайда** в DOM.

**Сеть (медиа):**

| Расстояние от active | Действие |
|----------------------|----------|
| 0 (active) | Full preload + play |
| +1 | Prefetch video (первые 1–3 MB) |
| +2 | Poster + metadata в store |
| +3 и дальше | Только metadata (id, poster, duration) |
| −1 (назад) | Держать в memory cache, не prefetch заново |
| ≤ −2 | Unload `src`, оставить poster |

**Пагинация API:** запрос следующей страницы, когда `activeIndex >= items.length - 5`.

### Лимиты (не перегружать сеть и устройство)

```typescript
const PreloadLimits = {
  maxConcurrentVideoPrefetches: 2,
  maxCacheSizeMB: 80,
  maxBufferedVideosInMemory: 3,
  prefetchDebounceMs: 180,
};
```

**Адаптация под сеть:**

```typescript
function shouldPrefetch(): boolean {
  const conn = navigator.connection;
  if (!conn) return true;
  if (conn.saveData) return false;
  if (['slow-2g', '2g'].includes(conn.effectiveType)) return false;
  return true;
}
```

При `saveData` или 2G: только poster для +1, без prefetch +2, lowest bitrate tier.

### Отмена при быстром скролле

```typescript
let prefetchTimer: ReturnType<typeof setTimeout>;
let abortController: AbortController | null = null;

function schedulePrefetch(index: number) {
  clearTimeout(prefetchTimer);
  abortController?.abort();

  prefetchTimer = setTimeout(() => {
    if (Math.abs(index - store.getState().feed.activeIndex) > 2) return;

    abortController = new AbortController();
    preloadManager.prefetch(items[index + 1], abortController.signal);
  }, PreloadLimits.prefetchDebounceMs);
}
```

### Predictive prefetch (улучшение)

Если scroll velocity высокая (пользователь быстро листает) → prefetch до +2.
Если медленная или пользователь на ролике > 1s → только +1 (экономия трафика).

---

## 4. Управление состоянием

### Разделение ответственности

```mermaid
flowchart LR
    subgraph Store["Redux (глобально)"]
        items["items: FeedItem[]"]
        cursor["cursor / hasMore"]
        activeIndex["activeIndex"]
        isMuted["isMuted"]
        playbackState["playing | paused | blocked"]
        viewedIds["viewedIds: Set"]
        likedIds["likedIds: Set"]
    end

    subgraph Local["Компонент (локально)"]
        isReady["isVideoReady"]
        showPoster["showPoster"]
        animState["UI animations"]
    end

    subgraph Refs["Refs (не state)"]
        videoRefs["Map<id, HTMLVideoElement>"]
        abortMap["prefetch AbortControllers"]
    end
```

### Что хранить где

**В Redux (slice `feed`):**

- список элементов ленты + pagination cursor;
- `activeIndex`, `isMuted`, глобальный playback state;
- user actions: liked, viewed;
- **не** хранить `currentTime` каждого видео — это вызывает 30+ re-render/sec.

**Локально в FeedSlide:**

- loading skeleton, buffering spinner;
- анимации (double-tap heart и т.п.).

**В refs (вне React state):**

- `Map<videoId, HTMLVideoElement>` — прямой доступ для orchestrator;
- abort controllers для prefetch.

### Селекторы (анти-pattern re-render)

```typescript
// ✅ Подписка только на нужные данные (useAppSelector + memoized selectors)
const item = useAppSelector(state => selectFeedItem(state, index));
const isActive = useAppSelector(state => state.feed.activeIndex === index);

// ❌ Подписка на весь slice без селектора
const feed = useAppSelector(state => state.feed);
```

Pagination через **RTK Query** (`feedApi.endpoints.getFeedPage`) — кэш страниц, dedupe запросов, invalidation при необходимости.

### Кэш просмотренного

| Уровень | Что храним | Зачем |
|---------|-----------|-------|
| In-memory LRU | URLs последних N видео | Быстрый возврат назад |
| SessionStorage | `viewedIds`, `lastActiveIndex` | Восстановление после refresh |
| HTTP cache браузера | MP4/WebM сегменты | Нативное кэширование без дублирования blob |
| IndexedDB (опционально) | Poster thumbnails | Offline-first, если потребуется |

```typescript
// store/feedSlice.ts
interface FeedState {
  items: FeedItem[];
  activeIndex: number;
  isMuted: boolean;
  playbackBlocked: boolean;
  viewedIds: string[];
  likedIds: string[];
}

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    appendPage(state, action: PayloadAction<FeedItem[]>) {
      state.items.push(...action.payload);
    },
    setActiveIndex(state, action: PayloadAction<number>) {
      state.activeIndex = action.payload;
    },
    setPlaybackBlocked(state, action: PayloadAction<boolean>) {
      state.playbackBlocked = action.payload;
    },
    markViewed(state, action: PayloadAction<string>) {
      if (!state.viewedIds.includes(action.payload)) {
        state.viewedIds.push(action.payload);
      }
    },
  },
});
```

---

## 5. Производительность

### Виртуализация длинного списка

1000 `<video>` в DOM — недопустимо (память, декодеры, layout).

**Подход:** windowed render через `@tanstack/react-virtual`:

```typescript
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => containerRef.current,
  estimateSize: () => window.innerHeight,
  overscan: 1,
});
```

При unmount слайда — обязательная очистка:

```typescript
function unloadVideo(video: HTMLVideoElement) {
  video.pause();
  video.removeAttribute('src');
  video.load(); // освобождает декодер
}
```

### Борьба с лишними re-render

- `React.memo(FeedSlide)` с compare по `item.id`, `isActive`, `isMuted`;
- progress bar обновлять через `requestAnimationFrame` + ref, не `setState`;
- playback orchestrator — singleton / module scope, не React context;
- избегать inline objects/functions в props слайдов.

### Поведение при быстром скролле

| Проблема | Решение |
|----------|---------|
| Много play()/pause() | Единый orchestrator + debounce 50ms |
| Чёрный кадр | Poster visible до `loadeddata`, crossfade opacity |
| Scroll jank | `will-change: transform` на overlay, не на `<video>` |
| Prefetch waste | Debounce + AbortController |
| Memory spike | Hard limit: max 3 video elements с src |

### Page Visibility

При `document.hidden` — pause active video, при возврате — resume только если slide всё ещё active. Экономит батарею и CPU.

### Метрики (для прототипа)

- **Web Vitals:** INP, LCP (poster as LCP element)
- **Custom:** `time_to_first_frame`, `time_to_switch`, `prefetch_hit_rate`
- **Quality:** `video.getVideoPlaybackQuality()?.droppedVideoFrames`

---

## 6. Что было бы сделано иначе

Осознанные улучшения по сравнению с типичным UX TikTok / Reels / Shorts:

| Область | Проблема в существующих продуктах | Предлагаемое решение |
|---------|-----------------------------------|----------------------|
| Autoplay без звука | Пользователь не понимает, что muted | Явный «Tap for sound» + запоминание выбора |
| Data saver | Агрессивный prefetch | Respect `Save-Data` + настройка «Wi-Fi only» |
| Accessibility | Плохая поддержка screen reader | `aria-label="Video 3 of 50"`, captions track, focus management |
| Skip back | Prev ролик иногда перезагружается | Держать −1 в memory без unload |
| Battery | Decode в фоне | Pause + unload при `document.hidden` |
| UI overload | Всё на экране сразу | Progressive disclosure: UI fade через 2s, tap показывает |
| Network errors | Чёрный экран | Poster + Retry + auto downgrade quality |
| Scroll prediction | Одинаковый prefetch | Velocity-based: быстрый scroll → +2, медленный → +1 |

---

## План реализации по этапам

| Этап | Что делаем | Результат |
|------|-----------|-----------|
| 1 | Fullscreen snap scroll, mock data, posters | Scroll UX без video |
| 2 | Один `<video>`, IO → active, muted loop | Autoplay работает |
| 3 | Virtualized window (4 slides), orchestrator | Multi-video без memory leak |
| 4 | Preload +1, pagination, abort on scroll | Плавные переходы |
| 5 | Unmute UX, visibility API, error states | Production-like polish |
| 6 | Метрики, README, deploy | Готово к демо |

**Оценка:** прототип — 1–2 дня; документ (этот README) — несколько часов.

### Структура проекта (для прототипа)

```
src/
  components/
    FeedShell.tsx          # layout, dvh container
    VirtualizedFeed.tsx    # tanstack virtual + snap
    FeedSlide.tsx          # poster + video + overlay
    VideoPlayer.tsx        # native video wrapper
  core/
    PlaybackOrchestrator.ts
    PreloadManager.ts
    IntersectionController.ts
  store/
    index.ts               # configureStore
    feedSlice.ts           # feed reducers
    feedApi.ts             # RTK Query endpoints
    selectors.ts           # memoized selectors (reselect)
  api/
    feedApi.ts             # mock + cursor pagination
  hooks/
    useActiveSlide.ts
    usePageVisibility.ts
  types/
    feed.ts
```

---

## Trade-offs

| Решение | Плюс | Минус |
|---------|------|-------|
| Native `<video>` | Простота, малый bundle | Меньше контроля над ABR без hls.js |
| CSS scroll snap | Нативная физика, a11y | Различия между браузерами |
| Redux Toolkit | DevTools, предсказуемый flow, RTK Query | Больше boilerplate, чем у minimal stores |
| Window 4 slides | Контроль памяти | Сложнее, чем render all |
| Muted autoplay | Работает везде | UX требует явного unmute |

---

## Что можно улучшить при большем времени

- **hls.js + adaptive bitrate** — если контент > 60 сек или нестабильная сеть
- **Service Worker** — offline cache для poster + metadata
- **Web Worker** — prefetch coordination вне main thread
- **SSR первого item** — OG meta для shareable links
- **E2E тесты** — Playwright: scroll → active video → preload next

---

*Автор: технический план для тестового задания «Лента медиа-контента (frontend)».*
