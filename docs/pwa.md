# MediNovel PWA

The production frontend registers `/sw.js` and includes an install manifest with 192 px and 512 px icons. Install requires HTTPS or `localhost` in a supported browser.

The service worker caches the application shell and versioned static assets. The build stamps its cache name from the generated HTML, so a changed deployment gets a new cache and removes the old one after activation. A waiting worker activates after open tabs using the old worker have closed, avoiding a forced update during a form submission.

Navigations request the network with `no-store` and use the cached application shell when offline. API requests and patient, appointment, payment, admission, and report responses are never stored in Cache Storage. Authentication and all clinical or payment actions require a connection; offline writes are not queued.

Before release, verify installation, offline shell, upgrade after deployment, sign-out and account switch, and deep route reload over HTTPS. Test these with two hospital accounts and a fresh browser profile.
