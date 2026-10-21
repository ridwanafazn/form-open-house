import { useEffect, useRef } from 'react';
import {
  LazyMotion,
  domAnimation,
  m,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'motion/react';
import { content } from '../config/content';

const stories = content.home.story;

export default function StorySection() {
  const prefersReduced = useReducedMotion();

  // Sembunyikan fallback statis saat island ini mount
  useEffect(() => {
    const el = document.getElementById('story-static');
    if (el) el.style.display = 'none';
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <div className="story-list">
        {stories.map((scene, i) => {
          const isScrollScene = i < 2;
          return isScrollScene ? (
            <ScrollScene key={scene.id} scene={scene} index={i} prefersReduced={!!prefersReduced} />
          ) : (
            <FadeScene key={scene.id} scene={scene} index={i} prefersReduced={!!prefersReduced} />
          );
        })}
      </div>
    </LazyMotion>
  );
}

// ---------------------------------------------------------------------------
// Adegan dengan efek parallax scroll (adegan 1 dan 2)
// ---------------------------------------------------------------------------
interface Scene {
  id: string;
  heading: string;
  text: string;
}

function ScrollScene({
  scene,
  index,
  prefersReduced,
}: {
  scene: Scene;
  index: number;
  prefersReduced: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Nomor adegan: geser ke atas saat scroll
  const numY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReduced ? [0, 0] : [-16, 16],
  );
  // Teks: geser lebih lambat (parallax ringan)
  const textY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReduced ? [0, 0] : [-8, 8],
  );

  const isEven = index % 2 === 0;

  return (
    <div ref={ref} className={`story-scene story-scene--scroll ${isEven ? '' : 'story-scene--flip'}`}>
      <m.div className="story-scene__num" style={{ y: numY }}>
        {String(index + 1).padStart(2, '0')}
      </m.div>
      <m.div className="story-scene__body" style={{ y: textY }}>
        <h3 className="story-scene__heading">{scene.heading}</h3>
        <p className="story-scene__text">{scene.text}</p>
      </m.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Adegan dengan fade + geser masuk (adegan 3 dan 4)
// ---------------------------------------------------------------------------
function FadeScene({
  scene,
  index,
  prefersReduced,
}: {
  scene: Scene;
  index: number;
  prefersReduced: boolean;
}) {
  const isEven = index % 2 === 0;

  return (
    <m.div
      className={`story-scene ${isEven ? '' : 'story-scene--flip'}`}
      initial={prefersReduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="story-scene__num">{String(index + 1).padStart(2, '0')}</div>
      <div className="story-scene__body">
        <h3 className="story-scene__heading">{scene.heading}</h3>
        <p className="story-scene__text">{scene.text}</p>
      </div>
    </m.div>
  );
}
