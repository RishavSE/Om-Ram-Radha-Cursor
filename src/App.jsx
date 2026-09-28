import { useEffect, useRef } from 'react';

function App() {
  const symbolRefs = useRef([]);

  useEffect(() => {
    const symbols = symbolRefs.current.filter(Boolean);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const positions = symbols.map(() => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 }));
    const target = { ...positions[0] };
    let frameId = null;
    let previousTime = 0;
    let settleTimer = null;

    const placeSymbols = () => {
      positions.forEach((position, index) => {
        symbols[index].style.left = `${position.x}px`;
        symbols[index].style.top = `${position.y}px`;
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
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <main className="stage" aria-label="Om cursor experience">
      {Array.from({ length: 12 }, (_, index) => {
        const scale = 1 - index * 0.045;
        return (
          <div
            key={index}
            ref={(element) => {
              symbolRefs.current[index] = element;
            }}
            className={`om-symbol trail-${index}`}
            aria-hidden="true"
            style={{
              '--rest-scale': 0.58 * scale,
              '--active-scale': scale,
              '--trail-opacity': 0.84 ** index,
            }}
          >
            ॐ
          </div>
        );
      })}
    </main>
  );
}

export default App;
