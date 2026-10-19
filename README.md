# twolizardsgames.com

The Two Lizards Games studio site: plain HTML and CSS, no build step, meant for GitHub Pages with the custom domain
`twolizardsgames.com` (the `CNAME` file).

- `index.html`: home page
- `dollhouse-shop/`: My Dream Dollhouse Shop (store badges go here once the apps are live)
- `privacy/`: privacy policy (the stores link to `https://twolizardsgames.com/privacy/`)
- `support/`: support email and FAQs (the stores link to `https://twolizardsgames.com/support/`)
- `img/logo.svg`: the logo (the user's picture of two chameleons, cropped round), in the header and as the browser-tab icon
- `img/two-lizards.jpg`: the whole picture with "TWO LIZARDS", at the top of the home page

Run it locally: `python3 -m http.server 8790`, then open http://localhost:8790.

Rules: no business street address, account numbers or ID numbers on the site (it's public). No cookies, analytics,
web fonts or scripts from other sites, so the privacy policy stays true. When the game's behavior changes (anything
it stores, sends or asks permission for), update `privacy/` to match before the change ships.
