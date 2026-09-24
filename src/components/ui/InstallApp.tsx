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

type InstallState = 'installed' | 'guides';

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

// The one place a User-Agent test is unavoidable: "Add to Home Screen" is a Safari
// menu item, not a web API, so there is nothing to feature-detect.

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

  useEffect(() => {
    setInstalled(isStandalone());
  }, []);

  const state: InstallState = installed ? 'installed' : 'guides';

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

      {/* Both phone guides are shown to everyone, not just the detected platform: this section is
          read from a laptop as often as from a phone, and someone setting the game up for a friend
          needs the other one. Desktop install is a footnote - the game is played on phones. */}
      <div className="install-guides">
        <Guide guide={copy.ios} />
        <Guide guide={copy.android} />
      </div>
      <p className="install-note t-caption">{copy.desktopNote}</p>
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
