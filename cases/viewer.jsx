import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@excalidraw/excalidraw/index.css';
import './viewer.css';
import { branches } from './content.mjs';

const sceneUrl = './ai-prime.excalidraw';
window.EXCALIDRAW_ASSET_PATH = new URL('./excalidraw-assets/', document.baseURI).href;

async function readJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

const categories = branches.flatMap((branch) => branch.categories);
const referrer = document.referrer ? new URL(document.referrer, location.href) : null;
const returnPath = referrer?.origin === location.origin && /^\/tg\/?$/.test(referrer.pathname)
  ? '/tg#cases'
  : '/#cases';

function Viewer({ Excalidraw, viewportCoordsToSceneCoords, scene, targets }) {
  const canvasApi = useRef(null);
  const started = useRef(false);
  const press = useRef(null);
  const tiles = useRef(scene.elements.filter((element) => element.id.endsWith('-tile')));
  const [topic, setTopic] = useState('overview');

  function fit(id) {
    const api = canvasApi.current;
    if (!api) return;
    const target = api.getSceneElements().filter((element) => targets[id].includes(element.id));
    if (target.length) {
      api.scrollToContent(target, { fitToViewport: true, viewportZoomFactor: 0.93 });
    }
  }

  function initCanvas(elements, appState) {
    if (started.current || appState.isLoading || elements.length === 0) return;
    started.current = true;
    requestAnimationFrame(() => fit('overview'));
  }

  function openTopic(id) {
    setTopic(id);
    fit(id);
  }

  function tileAt(event) {
    if (!canvasApi.current || !(event.target instanceof HTMLCanvasElement)) return null;
    const { x, y } = viewportCoordsToSceneCoords(event, canvasApi.current.getAppState());
    return tiles.current.find((tile) =>
      x >= tile.x && x <= tile.x + tile.width && y >= tile.y && y <= tile.y + tile.height);
  }

  function markPress(event) {
    press.current = event.isPrimary && event.button === 0
      ? { id: tileAt(event)?.id, x: event.clientX, y: event.clientY }
      : null;
  }

  function openTile(event) {
    const start = press.current;
    press.current = null;
    if (!start?.id || !event.isPrimary) return;
    const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (distance <= 7 && tileAt(event)?.id === start.id) {
      const id = start.id.slice(0, -'-tile'.length);
      requestAnimationFrame(() => openTopic(id));
    }
  }

  const selected = categories.find((category) => category.id === topic);

  return (
    <main className="workspace">
      <header className="map-toolbar" aria-label="Управление картой">
        <a className="map-link" href={returnPath}>← <span>На сайт</span></a>
        <label className="topic-select">
          <span className="sr-only">Раздел карты</span>
          <select value={topic} onChange={(event) => openTopic(event.target.value)}>
            <option value="overview">Вся карта</option>
            {branches.map((branch) => (
              <optgroup label={branch.title} key={branch.id}>
                <option value={branch.id}>Обзор · {branch.title}</option>
                {branch.categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.title}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <button className="map-link" type="button" onClick={() => fit(topic)}>Вписать</button>
        <a className="map-link download" href={sceneUrl} download aria-label="Скачать файл Excalidraw">
          <span className="download-wide">Скачать .excalidraw</span>
          <span className="download-short">Файл</span>
        </a>
      </header>
      <div
        className="map-canvas"
        aria-label="Карта проектов AI Prime"
        onPointerDownCapture={markPress}
        onPointerUpCapture={openTile}
        onPointerCancelCapture={() => { press.current = null; }}
        onPointerMoveCapture={(event) => { event.currentTarget.dataset.overTile = Boolean(tileAt(event)); }}
      >
        <Excalidraw
          initialData={scene}
          excalidrawAPI={(api) => { canvasApi.current = api; }}
          onChange={initCanvas}
          langCode="ru-RU"
          viewModeEnabled
          theme="light"
          UIOptions={{ canvasActions: { toggleTheme: false } }}
        />
      </div>
      <div className="sr-only">
        <h1>Что можно собрать после AI Prime</h1>
        {selected ? (
          <section>
            <h2>{selected.title}</h2>
            <p>{selected.description}</p>
            {selected.examples?.map((example) => <p key={example}>{example}</p>)}
            {selected.note && <p>Идея участника. {selected.note}</p>}
            {selected.practice && <p>{selected.practice}</p>}
            <h3>Что ещё можно собрать</h3>
            <ul>{selected.ideas.map((idea) => <li key={idea}>{idea}</li>)}</ul>
          </section>
        ) : (
          branches.map((branch) => (
            <section key={branch.id}>
              <h2>{branch.title}</h2>
              <ul>{branch.lessons.map((lesson) => <li key={lesson}>{lesson}</li>)}</ul>
              <ul>{branch.categories.map((category) => <li key={category.id}>{category.title}</li>)}</ul>
            </section>
          ))
        )}
      </div>
    </main>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<p className="map-status" role="status">Загружаем карту AI Prime…</p>);

try {
  const [{ Excalidraw, viewportCoordsToSceneCoords }, scene, targets] = await Promise.all([
    import('@excalidraw/excalidraw'),
    readJson(sceneUrl),
    readJson('./map-targets.json'),
  ]);
  root.render(<Viewer Excalidraw={Excalidraw} viewportCoordsToSceneCoords={viewportCoordsToSceneCoords} scene={scene} targets={targets} />);
} catch {
  root.render(
    <section className="map-status" role="alert">
      <p>Карта пока недоступна. Обновите страницу или скачайте файл.</p>
      <a href={sceneUrl} download>Скачать .excalidraw</a>
    </section>,
  );
}
