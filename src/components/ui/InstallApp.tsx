import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import PlayCTA from './PlayCTA';
import './InstallApp.css';

interface InstallGuide {
  title: string;
  steps: string[];
}

export interface InstallCopy {
  installed: string;
  button: string;
  buttonHint: string;
  ios: InstallGuide;
  android: InstallGuide;
  desktop: InstallGuide;
  fallback: string;
}

type InstallState = 'installed' | 'ios' | 'ios-other' | 'android' | 'desktop';

const IOS_DEVICE = /iPad|iPhone|iPod/;
// Chrome, Firefox, Edge, Opera, Yandex and DuckDuckGo on iOS. All of them are
// WebKit underneath, so no feature test tells them apart from Safari, and none of
// them can put a real web app on the home screen — they make a bookmark with no
// service worker, which would leave the visitor without the offline mode we
// promise. They get the generic fallback ("open it in Safari"), not the iOS steps.
const IOS_NON_SAFARI = /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|YaBrowser|DuckDuckGo/;

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

// The one place a User-Agent test is unavoidable: "Add to Home Screen" is a Safari
// menu item, not a web API, so there is nothing to feature-detect.
function detectPlatform(): Exclude<InstallState, 'installed'> {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  // iPadOS 13+ sends the desktop Mac UA; touch points are the only tell left.
  const ios = IOS_DEVICE.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (ios) return IOS_NON_SAFARI.test(ua) ? 'ios-other' : 'ios';
  return /Android/.test(ua) ? 'android' : 'desktop';
}

// There is no one-tap install button here on purpose, and `beforeinstallprompt`
// must not be added back: that event only fires for a document covered by the
// scope of a linked manifest. This landing has no manifest, and the game's
// (/play/manifest.json) declares scope "." → /play/, which does not cover "/".
// Giving the landing its own manifest would be worse than silence: nothing
// registers a service worker for "/", so the visitor would get an icon that fails
// to open offline — precisely when they counted on it. The game's service worker
// is registered by visiting /play, so the only honest order is: open the game
// first, add it to the home screen from there. Hence the link into the game.
export default function InstallApp({ copy }: { copy: InstallCopy }): JSX.Element {
  // Both values start at what the static build sees in Node. Detecting during the
  // first client render instead would make the markup disagree with the server and
  // throw away the hydration; the effect corrects it one paint later. So the
  // pre-JS HTML is the manual-instructions state, which is also the right answer
  // for crawlers and for anyone browsing without JavaScript.
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<Exclude<InstallState, 'installed'>>('desktop');

  useEffect(() => {
    setInstalled(isStandalone());
    setPlatform(detectPlatform());
  }, []);

  const state: InstallState = installed ? 'installed' : platform;

  if (state === 'installed') {
    return (
      <div className="install" data-install-state={state}>
        <p className="install-done t-body" role="status">
          <CheckMark />
          <span>{copy.installed}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="install" data-install-state={state}>
      <div className="install-action">
        <PlayCTA label={copy.button} target="browser" />
        <p className="install-hint t-caption">{copy.buttonHint}</p>
      </div>

      {/* One guide, not a wall of them: showing Android steps to a desktop visitor was noise, and
          the old catch-all line claimed "this browser cannot add the icon" to Chrome, which can. */}
      {state === 'ios-other' ? (
        <p className="install-note t-caption">{copy.fallback}</p>
      ) : (
        <Guide guide={state === 'ios' ? copy.ios : state === 'android' ? copy.android : copy.desktop} />
      )}
    </div>
  );
}

function Guide({ guide }: { guide: InstallGuide }) {
  return (
    <div className="install-guide">
      <h3 className="t-h3 install-guide-title">{guide.title}</h3>
      <ol className="install-steps">
        {guide.steps.map((step) => (
          <li key={step} className="t-caption">
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}

function CheckMark() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" />
      <path d="m8 12.4 2.9 2.9L16 10" />
    </svg>
  );
}
