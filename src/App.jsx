import { useEffect, useRef, useState } from 'react';

function App() {
  const symbolRefs = useRef([]);
  const audioRef = useRef(null);
  const soundEnabledRef = useRef(false);
  const soundStopTimerRef = useRef(null);
  const soundFadeIntervalRef = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundUnavailable, setSoundUnavailable] = useState(false);
  const [activeView, setActiveView] = useState('om');
  const mantra = activeView === 'om'
    ? 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् । उर्वारुकमिव बन्धनान् मृत्योर्मुक्षीय मामृतात् ॥'
    : 'श्री राम जय राम जय जय राम । सीता राम सीता राम जय जय राम ॥';

  const selectView = (view) => {
    const audio = audioRef.current;
    setActiveView(view);
    soundEnabledRef.current = true;
    setSoundEnabled(true);
    setSoundUnavailable(false);
    if (!audio) return;

    window.clearTimeout(soundStopTimerRef.current);
    window.clearInterval(soundFadeIntervalRef.current);
    audio.pause();
    audio.src = view === 'om' ? '/ommantra.mp3' : '/ram%20jaap.mp3';
    audio.currentTime = 0;
    audio.playbackRate = 1;
    audio.volume = 0.72;
    audio.load();
    void audio.play().catch(() => setSoundUnavailable(true));
  };

  const toggleSound = () => {
    const audio = audioRef.current;
    if (!audio) {
      setSoundUnavailable(true);
      return;
    }

    if (soundEnabledRef.current) {
      soundEnabledRef.current = false;
      setSoundEnabled(false);
      window.clearTimeout(soundStopTimerRef.current);
      window.clearInterval(soundFadeIntervalRef.current);
      audio.pause();
      audio.currentTime = 0;
      audio.playbackRate = 1;
      audio.volume = 0.72;
      return;
    }

    soundEnabledRef.current = true;
    setSoundEnabled(true);
    setSoundUnavailable(false);
  };

  useEffect(() => {
    const symbols = symbolRefs.current.filter(Boolean);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const positions = symbols.map(() => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 }));
    const target = { ...positions[0] };
    let frameId = null;
    let previousTime = 0;
    let settleTimer = null;
    const audio = audioRef.current;

    const startMantra = () => {
      if (!soundEnabledRef.current || !audio) return;
      window.clearInterval(soundFadeIntervalRef.current);
      audio.playbackRate = 1;
      audio.volume = 0.72;
      if (audio.paused) {
        void audio.play().catch(() => setSoundUnavailable(true));
      }
    };

    const fadeMantra = () => {
      if (!audio || audio.paused) return;
      audio.playbackRate = 0.88;
      const startingVolume = audio.volume;
      const fadeStartedAt = performance.now();
      window.clearInterval(soundFadeIntervalRef.current);
      soundFadeIntervalRef.current = window.setInterval(() => {
        const progress = Math.min((performance.now() - fadeStartedAt) / 1400, 1);
        audio.volume = startingVolume * (1 - progress);
        if (progress === 1) {
          window.clearInterval(soundFadeIntervalRef.current);
          soundFadeIntervalRef.current = null;
          audio.pause();
          audio.currentTime = 0;
          audio.playbackRate = 1;
          audio.volume = 0.72;
        }
      }, 40);
    };

    const placeSymbols = () => {
      positions.forEach((position, index) => {
        symbols[index].style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
      });
    };

    const animate = (time) => {
      const elapsed = previousTime ? time - previousTime : 16;
      previousTime = time;
      let isMoving = false;

      positions.forEach((position, index) => {
        const follow = index === 0 ? target : positions[index - 1];
        const easing = 1 - Math.exp(-elapsed / (140 + index * 12));
        position.x += (follow.x - position.x) * easing;
        position.y += (follow.y - position.y) * easing;

        if (Math.abs(follow.x - position.x) > 0.1 || Math.abs(follow.y - position.y) > 0.1) {
          isMoving = true;
        }
      });

      placeSymbols();

      if (isMoving) {
        frameId = window.requestAnimationFrame(animate);
      } else {
        frameId = null;
        previousTime = 0;
      }
    };

    const moveSymbol = (event) => {
      if (event.type === 'pointermove' && soundEnabledRef.current) {
        window.clearTimeout(soundStopTimerRef.current);
        startMantra();
        soundStopTimerRef.current = window.setTimeout(() => {
          fadeMantra();
        }, 320);
      }
      target.x = event.clientX;
      target.y = event.clientY;
      symbols.forEach((symbol) => symbol.classList.add('is-active'));
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        symbols.forEach((symbol) => symbol.classList.remove('is-active'));
      }, 180);

      if (reduceMotion.matches) {
        for (let index = positions.length - 1; index > 0; index -= 1) {
          positions[index].x = positions[index - 1].x;
          positions[index].y = positions[index - 1].y;
        }
        positions[0].x = target.x;
        positions[0].y = target.y;
        placeSymbols();
        return;
      }

      if (frameId === null) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    placeSymbols();
    window.addEventListener('pointermove', moveSymbol, { passive: true });
    window.addEventListener('pointerdown', moveSymbol, { passive: true });

    return () => {
      window.removeEventListener('pointermove', moveSymbol);
      window.removeEventListener('pointerdown', moveSymbol);
      window.clearTimeout(settleTimer);
      window.clearTimeout(soundStopTimerRef.current);
      window.clearInterval(soundFadeIntervalRef.current);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      soundEnabledRef.current = false;
      if (audio) audio.pause();
    };
  }, []);

  return (
    <main className={`stage stage--${activeView}`} aria-label={`${activeView === 'om' ? 'Om' : 'Ram'} cursor experience`}>
      <header className="view-switcher">
        <nav className="view-tabs" aria-label="Choose cursor">
          <button
            type="button"
            className={activeView === 'om' ? 'view-tab is-selected' : 'view-tab'}
            aria-pressed={activeView === 'om'}
            onClick={() => selectView('om')}
          >
            <span aria-hidden="true">ॐ</span> Om
          </button>
          <button
            type="button"
            className={activeView === 'ram' ? 'view-tab is-selected' : 'view-tab'}
            aria-pressed={activeView === 'ram'}
            onClick={() => selectView('ram')}
          >
            <span aria-hidden="true">राम</span> Ram
          </button>
        </nav>
      </header>
      {activeView === 'ram' && <div className="ram-watermark" aria-hidden="true">श्री राम</div>}
      {Array.from({ length: 12 }, (_, index) => {
        const scale = 1 - index * 0.045;
        return (
          <div
            key={index}
            ref={(element) => {
              symbolRefs.current[index] = element;
            }}
            className={`om-symbol trail-${index}${activeView === 'ram' ? ' ram-symbol' : ''}`}
            aria-hidden="true"
            style={{
              '--rest-scale': 0.58 * scale,
              '--active-scale': scale,
              '--trail-opacity': 0.84 ** index,
              zIndex: 20 - index,
            }}
          >
            <span className="om-glyph">{activeView === 'om' ? 'ॐ' : 'राम'}</span>
          </div>
        );
      })}
      <div className="mantra-marquee">
        <div className="mantra-track">
          <span>{mantra}</span>
          <span aria-hidden="true">{mantra}</span>
        </div>
      </div>
      <audio
        ref={audioRef}
        src="/ommantra.mp3"
        hidden
        preload="auto"
        loop
        onError={() => setSoundUnavailable(true)}
      />
      <button
        className="sound-toggle"
        type="button"
        aria-pressed={soundEnabled}
        aria-label={soundEnabled ? 'Turn mantra sound off' : `Turn ${activeView === 'om' ? 'Om' : 'Ram'} sound on`}
        onClick={toggleSound}
      >
        <span aria-hidden="true">{activeView === 'om' ? 'ॐ' : 'राम'}</span>
        {soundEnabled ? ' sound on' : 'Enable sound'}
      </button>
      {soundUnavailable && <span className="sound-error" role="status">Mantra audio could not be played.</span>}
    </main>
  );
}

export default App;
